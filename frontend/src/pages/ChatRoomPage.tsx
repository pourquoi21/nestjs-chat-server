import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../api/axios';
import { UserSearchModal } from '../components/UserSearchModal';
import { MessageItem } from '../components/MessageItem';
import { useAuth } from '../context/AuthContext';
import type { MessageType, ChatMessage, SystemMessage } from '../types/message';
import type { ActiveUser as member } from '../features/users/UserProfile';


const ChatRoomPage = () => {
    // 주소창의 roomId값을 가져온다.
    const { roomId } = useParams<{ roomId: string }>();
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [inputText, setInputText] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const navigate = useNavigate();
    const { setCurrentUser, currentUser, isLoading } = useAuth();
    const location = useLocation();
    const roomTitle = location.state?.title ?? `채팅방 ${roomId}`
    const [members, setMembers] = useState<member[]>([]);

    // 맨 아래 지점을 가리킬 Ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 스크롤을 맨 아래로 내려주기
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
    }

    // 기존의 메시지 로드
    const fetchMessages = async () => {
        try {
          const response = await api.get(`chat/rooms/${roomId}/messages`);
          setMessages(response.data);
        } catch (error) {
          console.error('메시지 로드 실패:', error);
        }
    };

    // 참여중인 유저 로드
    const fetchMembers = async () => {
      try {
        const response = await api.get(`chat/rooms/${roomId}/members`);
        console.log(response.data);
        setMembers(response.data);
      } catch (error) {
        console.error('멤버 로드 실패:', error);
      }
    } 

    // 메시지 읽기
    const readMessages = async () => {
      try {
        await api.patch(`chat/rooms/${roomId}/read`);
      } catch (error) {
        console.error('메시지 읽기 실패:', error);
      }
    };
    
    // 디바운스 코드
    const readTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedReadMessages = () => {
      if (readTimeoutRef.current) clearTimeout(readTimeoutRef.current);
      readTimeoutRef.current = setTimeout(() => {
        readMessages();
      }, 500);
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    useEffect(() => {
        Promise.all([fetchMessages(), readMessages(), fetchMembers()]);

        
        const token = localStorage.getItem('accessToken');
        const backendUrl = import.meta.env.VITE_API_URL || `https://${window.location.hostname}:4000`;
        const socketUrl = `${backendUrl}/chat`;
        const numericRoomId = roomId ? parseInt(roomId, 10) : null;
        
        // socket.io연결
        const newSocket = io(socketUrl, {
          transports: ['websocket'],
          auth: {
            token: token ? `Bearer ${token}` : '',
          },
        });

        setSocket(newSocket);

        // connect후 백엔드에서 ready신호 주면 입장시키기
        newSocket.on('ready', () => {
          newSocket.emit('join_room', numericRoomId);
        });
        
        // 소켓 인증 에러 또는 연결 실패시
        newSocket.on('connect_error', (err) => {
          console.error('socker connection error:', err.message);
          alert('올바르지 않은 접근입니다. 다시 로그인해 주세요.');
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        });

        // 백엔드가 client.disconnect()로 강제연결 종료시 감지
        newSocket.on('disconnect', (reason) => {
          if (reason === 'io server disconnect') {
            alert('서버에 의해 연결이 끊어졌습니다. 다시 로그인해 주세요.');
            window.location.href = '/login';
          }
        });

        // 연결 성공 이벤트
        newSocket.on('connect', () => {
          // const numericRoomId = roomId ? parseInt(roomId, 10) : null;
          console.log('connect succeeded!');
        });

        // 메시지 수신, 백엔드에서 emit으로 보내주는것을 기다림
        // 이때 수신되면 기존메시지에 새로운 메시지 추가
        newSocket.on('message', (newMessage: ChatMessage) => {
          console.log(newMessage);
          const formattedMessage: ChatMessage = {
            type: 'chat',
            id: newMessage.id,
            content: newMessage.content,
            user: newMessage.user,
            created_at: newMessage.created_at,
          };

          setMessages((prev) => 
            [...prev, formattedMessage]
          );
          debouncedReadMessages();
        });

        // 시스템 메시지 수신
        newSocket.on('system_message', (newMessage: SystemMessage) => {
          const systemMessage: SystemMessage = {
            type: 'system',
            id: Date.now(),
            content: newMessage.content,
          }
          
          setMessages((prev) => 
            [ ...prev, systemMessage ]
          );
        })

        // 컴포넌트 종료시 cleanup
        return () => {
          console.log('socket end');
          
          if (readTimeoutRef.current) clearTimeout(readTimeoutRef.current);

          readMessages();
          // newSocket.emit('leave_room', parseInt(roomId!));
          newSocket.disconnect();
        }
    }, [roomId]);

    if (isLoading) return null;

    // 메시지 보내기
    const handleSendMessage = () => {
        if (!inputText.trim() || !socket) return;

        try {
          if (!roomId) {
            alert('Invalid roomId');
            return;
          }
          const parsedRoomId = parseInt(roomId, 10);

          if (isNaN(parsedRoomId)) {
            console.error('failed to parse roomId: ', roomId);
            return;
          }

          console.log('trying to send message to server ...', inputText);
          socket.emit('message', {
            room: parseInt(roomId!),
            msg: inputText,
          });
          console.log('sent message: ' + inputText);
      
        } catch (error) {
          console.error('error sending message to server... ', error);
        } finally {
          setInputText('');
        }
    };

    // 초대하기
    const handleInviteSubmit = async (userIds: number[]) => {
      try {
        await api.post(`chat/rooms/${roomId}/invite`, { invitedUserIds: userIds });
      } catch (error: any) {
        alert(error.response?.data?.message ?? '초대에 실패했습니다.');
      }
    };

    // 방에서 나가기
    const handleLeaveRoom = async () => {
      if (!window.confirm('방에서 나가시겠습니까?')) return;
      await api.delete(`/chat/rooms/${roomId}/leave`);
      navigate('/chat/rooms');
    };

    // 로그아웃
    const handleLogout = () => {
        const confirmLogout = confirm('로그아웃하시겠습니까?');
        if (confirmLogout) {
          localStorage.removeItem('accessToken');
          setCurrentUser(null);
          navigate('/login');
        }
    }

    return (
    <div style={styles.container}>
  
      {/* 헤더 */}
      <div style={styles.header}>
        <button onClick={() => navigate('/chat/rooms')}
          style={styles.backBtn}>
          ← 뒤로
        </button>
        <h2 style={styles.roomTitle}>{roomTitle}</h2>
        <div style={styles.buttons}>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            style={styles.inviteBtn}>
            초대
          </button>
          <UserSearchModal
            onInviteSubmit={handleInviteSubmit}
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            existingMembers={members}
          />
          <button onClick={handleLeaveRoom}
            style={styles.leaveBtn}>
            나가기
          </button>
          <button
            style={styles.logoutBtn}
            onClick={handleLogout}>
            로그아웃    
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={styles.messageListArea}>
        {messages.map((msg, index) => {
          const currentDate = 'created_at' in msg
            ? new Date(msg.created_at).toLocaleDateString('ko-KR')
            : null;
          const prevMsg = messages[index - 1];
          const prevDate = prevMsg && 'created_at' in prevMsg
            ? new Date(prevMsg.created_at).toLocaleDateString('ko-KR')
            : null;
          const showDateDivider = currentDate && currentDate !== prevDate;

          return (
            <div key={msg.id}>
              {showDateDivider && (
                 <div style={styles.dateDivider}>
                  ── {currentDate} ──
                </div>
              )}
              <MessageItem msg={msg} currentUserId={currentUser!.id} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div style={styles.msgBox}>
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="메시지를 입력해 주세요."
          style={styles.typingBox}
        />
        <button
          onClick={handleSendMessage}
          style={styles.sendBtn}
        >
          전송
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', padding: '0' },
  header: { 
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', borderBottom: '1px solid #ddd', backgroundColor: '#fff'
  },
  roomTitle: { margin: 0, fontSize: '16px', fontWeight: 600 },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' },
  buttons: { display: 'flex', gap: '8px', alignItems: 'center' },
  inviteBtn: {
    padding: '6px 14px', backgroundColor: '#999',
    color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '14px'
  },
  leaveBtn: {
    padding: '6px 14px', backgroundColor: '#e53e3e',
    color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '14px'
  },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#e53e3e', fontSize: '14px',
  },
  messageListArea: { flex: 1, overflowY: 'scroll', padding: '16px' },
  dateDivider: { textAlign: 'center', color: '#888', margin: '12px 0', fontSize: '12px' },
  msgBox: { 
    display: 'flex', padding: '12px 20px', borderTop: '1px solid #ddd', backgroundColor: '#fff'
  },
  typingBox: {
    flex: 1, padding: '8px 12px', border: '1px solid #ddd',
    borderRadius: '20px', outline: 'none'
  },
  sendBtn: {
    marginLeft: '8px', padding: '8px 16px',
    backgroundColor: '#4CAF50', color: 'white', border: 'none',
    borderRadius: '20px', cursor: 'pointer', fontSize: '14px'
  },
}

export default ChatRoomPage;