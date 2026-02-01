-- 1. 데이터베이스 생성 및 선택
CREATE DATABASE IF NOT EXISTS grid_talk;
SET NAMES utf8mb4;
USE grid_talk;

ALTER DATABASE grid_talk CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 2. 사용자 (User) 테이블
-- 보안도 중요하므로 password는 해시값(암호화)으로 저장한다고 가정
CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     email VARCHAR(100) NOT NULL UNIQUE COMMENT '로그인 ID 역할',
                                     password VARCHAR(255) NOT NULL COMMENT 'Bcrypt 등으로 암호화된 비밀번호',
                                     nickname VARCHAR(50) NOT NULL COMMENT '채팅에 표시될 이름',
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 채팅방 (ChatRoom) 테이블
CREATE TABLE IF NOT EXISTS chat_rooms (
                                          id INT AUTO_INCREMENT PRIMARY KEY,
                                          title VARCHAR(100) COMMENT '방 제목 (NULL이면 참여자 이름으로 자동 생성)',
                                          type VARCHAR(10) DEFAULT 'GROUP' COMMENT 'INDIVIDUAL(1:1) 또는 GROUP',
                                          last_message TEXT COMMENT '채팅방 목록 미리보기용 (역정규화)',
                                          last_message_at TIMESTAMP NULL COMMENT '정렬을 위한 마지막 메시지 시간',
                                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 채팅 메시지 (ChatMessage) 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
                                             id INT AUTO_INCREMENT PRIMARY KEY,
                                             room_id INT NOT NULL,
                                             sender_id INT NOT NULL,
                                             content TEXT NOT NULL,
                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
                                             FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                                             INDEX idx_room_created (room_id, created_at) -- 채팅방 들어가서 스크롤 올릴 때 성능 최적화
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 채팅방 멤버 (ChatRoomMember) 테이블
CREATE TABLE IF NOT EXISTS chat_room_members (
                                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                                 room_id INT NOT NULL,
                                                 user_id INT NOT NULL,
                                                 joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                 last_read_message_id INT DEFAULT 0 COMMENT '안 읽은 메시지 계산용',
                                                 FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
                                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                                                 UNIQUE KEY unique_participation (room_id, user_id) -- 한 방에 중복 참여 방지
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [테스트용 더미 데이터] --
-- 개발 편의를 위해 서버 뜰 때마다 넣어두면 편함 (비번은 '1234'라고 가정)
INSERT IGNORE INTO users (email, password, nickname) VALUES
                                                         ('postman1@test.com', '$2b$10$zjjlj66KJGKkrNO.r167yu8v9ohTmJBT98h1zBmCs4.KGhkzlDhAS', '포스트맨1'),
                                                         ('postman2@test.com', '$2b$10$8vjV/bseHNUWusB6Wa785e4/xQW8W6e8fI3Xb5XqNbekluQtd6.TS', '포스트맨2');