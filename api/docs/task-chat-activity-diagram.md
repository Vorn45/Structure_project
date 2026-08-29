# Task Chat Activity Diagram

## Description

Task chat allows authorized project users to communicate inside a specific task. Each task has one task-type chat room linked by `task_id`. When a user opens the task chat, the system validates project access, loads the room, ensures the user is a chat member, marks the room as read, and returns the conversation timeline. When a user sends a message, the system validates the room, saves the message and any uploaded files, updates the room's latest activity time, creates notifications for other non-muted members, emits a room update event, and returns the created message.

## Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[User opens task chat or sends chat message]
    B --> C{Request type}

    C -->|Open chat room| D[Receive task_id and optional project_id]
    D --> E[Find task with project and assignees]
    E --> F{Task and project exist?}
    F -->|No| G[Return 404 Task not found]
    F -->|Yes| H[Check project access]
    H --> I{User has access?}
    I -->|No| J[Return 403 Forbidden]
    I -->|Yes| K[Find task chat room by task_id and type TASK]
    K --> L{Room exists?}
    L -->|No| M[Return 404 Chat room not found]
    L -->|Yes| N[Ensure current user is ChatMember]
    N --> O[Mark room as read]
    O --> P[Load members, messages, attachments, sender data, and system logs]
    P --> Q[Map room response with unread count 0]
    Q --> R([Return chat room detail])

    C -->|Send message| S[Receive room_id, optional content, optional parent_message_id, and files]
    S --> T[Find chat room with project/task]
    T --> U{Room exists and project matches?}
    U -->|No| V[Return 404 Chat room not found]
    U -->|Yes| W[Check project access]
    W --> X{User has access?}
    X -->|No| Y[Return 403 Forbidden]
    X -->|Yes| Z[Ensure current user is ChatMember]
    Z --> AA{Content or file exists?}
    AA -->|No| AB[Return 400 Message must have content or file]
    AA -->|Yes| AC[Start database transaction]
    AC --> AD[Create ChatMessage]
    AD --> AE{Files uploaded?}
    AE -->|Yes| AF[Upload each file and store File record]
    AF --> AG[Create ChatAttachment records]
    AG --> AH[Set first file as legacy file_id when needed]
    AE -->|No| AI[Skip file attachment steps]
    AH --> AJ[Update ChatRoom.last_message_at]
    AI --> AJ
    AJ --> AK[Find room members]
    AK --> AL[Create Notification records for non-muted members except sender]
    AL --> AM[Commit transaction]
    AM --> AN[Emit room update event]
    AN --> AO[Reload message with sender and attachment data]
    AO --> AP([Return created message])
```

## Explanation

The task chat process starts from the task module endpoints such as `GET /api/user/task/chatroom` and `POST /api/user/task/chatroom/message`. The controller forwards the authenticated user and request data to `ChatRoomService`.

For viewing chat, the service first verifies that the task exists, has an active project, and belongs to the requested project when `project_id` is provided. Access is granted to a super administrator, the project creator, a project member, or an organization administrator of the project. After access is confirmed, the system loads the task chat room, adds the current user as a room member if they are not already a member, marks the room as read, and returns the full timeline.

The returned timeline combines normal user messages from `chat.chat_message` with system messages generated from task activity logs and project audit logs. This lets users see both conversation messages and important task/project history in one chat view.

For sending chat, the service validates the chat room and project access, ensures membership, then checks that the request contains either text content or at least one uploaded file. The message creation runs inside a database transaction. It creates the `ChatMessage`, uploads and stores files when provided, creates `ChatAttachment` rows, updates `ChatRoom.last_message_at`, and creates notifications for other non-muted room members. After the transaction succeeds, the service emits a room update event and returns the newly created message.

## Main Database Tables

- `chat.chat_room`: Stores the task chat room. For task chat, `type` is `task` and `task_id` links the room to `task.task`.
- `chat.chat_member`: Stores users who participate in the room, their chat role, mute state, and read state.
- `chat.chat_message`: Stores text/file messages, sender, optional reply parent, message type, and edit/delete timestamps.
- `chat.chat_attachment`: Links uploaded file records to chat messages.
- `file.file`: Stores uploaded file metadata.
- `notification.notification`: Stores notifications created for other room members after a message is sent.
- `task.task_activity_log`: Provides task system messages shown in the chat timeline.
- `audit.audit_log`: Provides project system messages shown in the chat timeline.

## Alternative Flows

- If the task does not exist, is deleted, or its project is missing/deleted, the system returns `Task not found`.
- If the chat room does not exist, the system returns `Chat room not found`.
- If the current user does not have project access, the system returns a forbidden response.
- If a user sends a message without content and without files, the system rejects the request.
- If the user is not yet a `ChatMember` but has project access, the system automatically adds them to the room as a member.
