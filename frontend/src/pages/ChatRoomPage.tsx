import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../api/axios';
import { UserSearchModal } from '../components/UserSearchModal';

interface User {
  id: number;
  nickname: string;
}

export interface ChatMessage {
  type: 'chat';
  id: number;
  content: string;
  created_at: string;
  user: User;
}

interface SystemMessage {
  type: 'system';
  id: number;
  content: string;
}

type MessageItem = ChatMessage | SystemMessage;

const ChatRoomPage = () => {
    // 주소창의 roomId값을 가져온다.
    const { roomId } = useParams<{ roomId: string }>();
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [inputText, setInputText] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const navigate = useNavigate();

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
            console.log(response.data);
            setMessages(response.data);
        } catch (error) {
            console.error('메시지 로드 실패:', error);
        }
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchMessages();

        const token = localStorage.getItem('accessToken');
        const socketUrl = `http://${window.location.hostname}:4000/chat`;
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
          // newSocket.emit('leave_room', parseInt(roomId!));
          newSocket.disconnect();
        }
    }, [roomId]);


    // 메시지 보내기
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

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
            // temporaryId: Date.now(),
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
      await api.post(`chat/rooms/${roomId}/invite`, { invitedUserIds: userIds });
    };

    // 방에서 나가기
    const handleLeaveRoom = async () => {
      if (!window.confirm('방에서 나가시겠습니까?')) return;
      await api.delete(`/chat/rooms/${roomId}/leave`);
      navigate('/chat/rooms');
    };

    return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '0' }}>
  
      {/* 헤더 */}
      <div style={styles.header}>
        <button onClick={() => navigate('/chat/rooms')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
          ← 뒤로
        </button>
        <h2 style={{ margin: 0, fontSize: '16px' }}>채팅방 {roomId}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setIsInviteModalOpen(true)}
            style={styles.inviteBtn}  
          >초대</button>
          <UserSearchModal
            onInviteSubmit={handleInviteSubmit}
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}  
          />
          <button onClick={handleLeaveRoom}
            style={styles.leaveBtn}>
            나가기
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{ flex: 1, overflowY: 'scroll', padding: '16px' }}>
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
                 <div style={{ textAlign: 'center', color: '#888', margin: '12px 0', fontSize: '12px' }}>
                  ── {currentDate} ──
                </div>
              )}
              {msg.type === 'system' ? (
                <div style={{ textAlign: 'center', color: '#888', margin: '8px 0', fontSize: '13px' }}>
                  ── {msg.content} ──
                </div>
              ) : (
                <p key={msg.id} style={{ margin: '6px 0' }}>
                  <strong>{msg.user.nickname}:</strong> {msg.content}
                  <small>{new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit'})}</small>
                </p>
              )}
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

const styles = {
  sendBtn: { marginLeft: '8px', padding: '8px 16px',
    backgroundColor: '#4CAF50', color: 'white', border: 'none',
    borderRadius: '20px', cursor: 'pointer'
  },
  typingBox: {
    flex: 1, padding: '8px 12px', border: '1px solid #ddd',
    borderRadius: '20px', outline: 'none'
  },
  msgBox: { 
    display: 'flex', padding: '12px 20px', borderTop: '1px solid #ddd', backgroundColor: '#fff'
  },
  header: { 
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', borderBottom: '1px solid #ddd', backgroundColor: '#fff'
  },
  leaveBtn: { padding: '8px 16px', backgroundColor: '#e53e3e',
    color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer'
  },
  inviteBtn: {padding: '8px 16px', backgroundColor: '#999',
    color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer'}
}

export default ChatRoomPage;