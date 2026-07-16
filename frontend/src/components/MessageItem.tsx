import type { MessageType } from '../types/message';

interface MessageTypeProps {
    msg: MessageType;
    currentUserId: number;
}

export const MessageItem = ({ msg, currentUserId }: MessageTypeProps) => {
    if (msg.type === 'system') {
      return (
        <div
          style={styles.systemMessage}>
          ── {msg.content} ──
        </div>
      );
    }

    const isMyMessage = msg.user.id === currentUserId;

    return (
      <div style={styles.messageRow(isMyMessage)}>
        <div style={styles.bubble(isMyMessage)}>
          {!isMyMessage && (
            <div style={styles.nickname}>
              {msg.user.nickname}
            </div>
          )}
          <div>{msg.content}</div>
          <small style={styles.time}>
            {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </small>
        </div>
      </div>
    );
}

const styles: {
  messageRow: (isMyMessage: boolean) => React.CSSProperties;
  bubble: (isMyMessage: boolean) => React.CSSProperties;
  nickname: React.CSSProperties;
  time: React.CSSProperties;
  systemMessage: React.CSSProperties;
  } = {
  messageRow: (isMyMessage: boolean) => ({
    display: 'flex',
    flexDirection: isMyMessage ? 'row-reverse' : 'row',
    alignItems: 'flex-end',
    margin: '4px 0',
  }),

  bubble: (isMyMessage: boolean) => ({
    backgroundColor: isMyMessage ? '#4CAF50' : '#f1f1f1',
    color: isMyMessage ? 'white' : 'black',
    padding: '8px 12px',
    borderRadius: '12px',
    textAlign: isMyMessage ? 'right' : 'left',
    maxWidth: '60%',
  }),

  nickname: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
  },

  time: {
    fontSize: '11px',
    opacity: 0.7,
  },

  systemMessage: {
    textAlign: 'center',
    color: '#888',
    margin: '8px 0',
    fontSize: '13px',
  },
}