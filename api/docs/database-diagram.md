# PMS Database Diagram DBML

Generated from TypeORM entity metadata in `src/app/model/**/*.entity.ts`. Paste the DBML block below into https://dbdiagram.io/.

```dbml
Project PMS_API {
  database_type: 'PostgreSQL'
  Note: 'Generated from NestJS TypeORM entities. Schemas: activity, application, audit, chat, custom_field, file, meeting, notification, organization, project, report, sprint, task, user.'
}

Enum audit.audit_log_action_enum {
  create
  update
  delete
  restore
  login
  logout
  invite_member
  remove_member
  change_role
}

Enum chat.chat_member_role_enum {
  owner
  admin
  member
  guest
}

Enum chat.chat_room_type_enum {
  organization
  project
  task
  meeting
  direct
  group
}

Enum custom_field.custom_field_type_enum {
  text
  textarea
  number
  boolean
  date
  datetime
  select
  multi_select
  user
  url
  email
  phone
}

Enum custom_field.custom_field_value_entity_type_enum {
  task
  epic
  milestone
  project
}

Enum meeting.meeting_status_enum {
  scheduled
  in_progress
  completed
  cancelled
}

Enum notification.notification_type_enum {
  task_assigned
  task_updated
  task_comment
  task_mention
  chat_message
  project_invite
  sprint_started
  sprint_completed
}

Enum organization.organization_status_enum {
  active
  suspended
  archived
}

Enum organization.organization_member_status_enum {
  invited
  active
  suspended
  left
  removed
}

Enum project.epic_status_enum {
  open
  in_progress
  completed
  cancelled
  archived
}

Enum project.milestone_status_enum {
  planned
  in_progress
  completed
  delayed
  cancelled
}

Enum project.project_member_role_task_delete_scope_enum {
  all
  owner
  reporter_only
  none
}

Enum project.roadmap_item_status_enum {
  planned
  in_progress
  completed
  delayed
  cancelled
}

Enum report.report_type_enum {
  project_summary
  task_summary
  workload
  productivity
  sprint
  timeline
  milestone
  performance
  activity
}

Enum sprint.sprint_status_enum {
  planned
  active
  completed
  cancelled
}

Enum task.task_dependency_type_enum {
  blocks
  blocked_by
  related_to
  duplicates
}

Enum user.user_auth_provider_enum {
  local
  google
  telegram
}

Table activity.activity {
  id uuid [pk]
  organization_id uuid [not null]
  project_id uuid [not null]
  status_id int [default: 2]
  created_by int
  title varchar(150)
  start_date timestamp
  end_date timestamp
  archive boolean [not null, default: false]
  pin boolean [not null, default: false]
  created_at timestamptz [not null]
  deleted_at timestamp

  indexes {
    (project_id, title) [unique, name: 'UQ_d3f56927b85d6167b2912bbf705']
  }
}

Table activity.activity_assignee {
  id uuid [pk]
  activity_id uuid [not null]
  user_id int [not null]
  assigned_at timestamp [not null]

  indexes {
    (activity_id, user_id) [unique, name: 'UQ_057c9f71d20eeb38d2a1912a86e']
  }
}

Table activity.activity_attachment {
  id uuid [pk]
  activity_id uuid [not null]
  file_id int [not null]
  uploaded_by_id int [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table activity.activity_status {
  id int [pk, increment]
  name_en varchar(100) [not null]
  name_kh varchar(100)
  file_id int
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    name_en [unique, name: 'UQ_68c1099e9b306db77996496e856']
  }
}

Table application.application {
  id int [pk, increment]
  system_name varchar(150) [not null]
  version varchar(50) [not null]
  address text
  morning_start_time time [not null]
  morning_end_time time [not null]
  afternoon_start_time time [not null]
  afternoon_end_time time [not null]
  phone_number varchar(50)
  email varchar(150)
  start_day_of_week_id int [not null]
  end_day_of_week_id int [not null]
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table application.application_funtional {
  id int [pk, increment]
  name varchar(150) [not null]
  file_id int
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table application.days_in_week {
  id int [pk, increment]
  name_en varchar(50) [not null]
  name_kh varchar(50) [not null]
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table audit.audit_log {
  id uuid [pk]
  organization_id uuid
  user_id int
  action audit.audit_log_action_enum [not null]
  entity_type varchar(100) [not null]
  entity_id uuid
  old_value jsonb
  new_value jsonb
  ip_address inet
  user_agent text
  created_at timestamp [not null]
}

Table chat.chat_attachment {
  id uuid [pk]
  message_id uuid [not null]
  file_id int [not null]
  uploaded_by_id int [not null]
  created_at timestamp [not null]
}

Table chat.chat_member {
  id uuid [pk]
  room_id uuid [not null]
  user_id int [not null]
  last_read_message_id uuid
  role chat.chat_member_role_enum [not null, default: 'member']
  is_muted boolean [not null, default: false]
  last_read_at timestamp
  joined_at timestamp [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (room_id, user_id) [unique, name: 'UQ_34429a3b7076185e966b15d4bb2']
  }
}

Table chat.chat_message {
  id uuid [pk]
  room_id uuid [not null]
  sender_id int
  file_id int
  parent_message_id uuid
  chat_message_type_id int [not null, default: 1]
  content text
  is_edited boolean [not null, default: false]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (room_id, created_at) [name: 'IDX_bc48dcd770589e299b53adb09f']
  }
}

Table chat.chat_message_type {
  id int [pk, increment]
  value varchar(50) [not null]
  name varchar(100) [not null]
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    value [unique, name: 'UQ_9aeeb4bcf9bbcd35ddb805aa092']
  }
}

Table chat.chat_room {
  id uuid [pk]
  organization_id uuid
  project_id uuid
  task_id uuid
  meeting_id uuid
  created_by_id int [not null]
  type chat.chat_room_type_enum [not null, default: 'project']
  name varchar(150)
  description text
  is_private boolean [not null, default: false]
  last_message_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (project_id, task_id) [name: 'IDX_5ea988b46dbdbe602778c4443e']
    (organization_id, project_id) [name: 'IDX_db865b6bc8f7928749e4795645']
  }
}

Table custom_field.custom_field {
  id uuid [pk]
  organization_id uuid [not null]
  project_id uuid
  name varchar(150) [not null]
  field_key varchar(150) [not null]
  type custom_field.custom_field_type_enum [not null, default: 'text']
  options jsonb
  is_required boolean [not null, default: false]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (organization_id, project_id, field_key) [unique, name: 'UQ_d9d6ba6da8bed9672e621b0a528']
  }
}

Table custom_field.custom_field_value {
  id uuid [pk]
  custom_field_id uuid [not null]
  entity_type custom_field.custom_field_value_entity_type_enum [not null, default: 'task']
  entity_id uuid [not null]
  value jsonb
  created_at timestamp [not null]
  updated_at timestamp [not null]

  indexes {
    (custom_field_id, entity_type, entity_id) [unique, name: 'UQ_2b38bc5d77873d12476ab49364b']
  }
}

Table file.file {
  id int [pk, increment]
  title varchar(255) [not null]
  extention varchar(20)
  type varchar(50)
  size integer [not null, default: 0]
  ref_table varchar(100)
  ref_id varchar(50)
  folder_id integer
  uri varchar(500)
  file_domain varchar(255)
  active char [not null, default: 1]
  created_datetime timestamp [not null]
  created_by varchar(50)
  updated_datetime timestamp [not null]
  updated_by varchar(50)
  deleted_datetime timestamp
  deleted_by varchar(50)
}

Table file.project_file_folder {
  id uuid [pk]
  project_id uuid [not null]
  parent_id uuid
  external_folder_id int
  parent_external_folder_id int
  name varchar(150) [not null]
  created_by int
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (project_id, external_folder_id) [unique, name: 'UQ_c2d8c7449a263c758b070eabbeb']
  }
}

Table meeting.meeting {
  id uuid [pk]
  project_id uuid
  organizer_id int [not null]
  title varchar(255) [not null]
  description text
  location text
  status meeting.meeting_status_enum [not null, default: 'scheduled']
  meeting_date date [not null]
  start_time time
  end_time time
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table meeting.meeting_participant {
  id uuid [pk]
  meeting_id uuid [not null]
  user_id int [not null]
  created_at timestamp [not null]

  indexes {
    (meeting_id, user_id) [unique, name: 'UQ_f20c66bd575365a3fcc95704974']
  }
}

Table notification.notification {
  id uuid [pk]
  user_id int [not null]
  organization_id uuid
  project_id uuid
  task_id uuid
  activity_id uuid
  type notification.notification_type_enum [not null]
  title varchar(200) [not null]
  title_kh varchar(200)
  title_en varchar(200)
  message text
  message_kh text
  message_en text
  data jsonb
  read_at timestamp
  created_at timestamp [not null]
}

Table organization.organization {
  id uuid [pk]
  name_en varchar(150) [not null]
  name_kh varchar(150) [not null]
  slug varchar(150) [not null]
  description text
  logo_id int
  background_logo_id int
  owner_id int [not null]
  status organization.organization_status_enum [not null, default: 'active']
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    slug [unique, name: 'UQ_a08804baa7c5d5427067c49a31f']
  }
}

Table organization.organization_member {
  id uuid [pk]
  organization_id uuid [not null]
  user_id int [not null]
  position_id int
  creator_id int
  status organization.organization_member_status_enum [not null, default: 'active']
  joined_at timestamp [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (organization_id, user_id) [unique, name: 'UQ_ade1a22b88a5464464fe520d070']
  }
}

Table organization.organization_position {
  id int [pk, increment]
  name_kh varchar(100) [not null]
  name_en varchar(100) [not null]
  icon_id int
  creator_id int
  organization_id uuid
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (name_en, organization_id) [unique, name: 'UQ_7c7f42e5ba9e391746c869e1264']
  }
}

Table project.challenge_status {
  id int [pk, increment]
  name_en varchar(100) [not null]
  name_kh varchar(100) [not null]
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table project.checklist_item {
  id uuid [pk]
  checklist_phase_id uuid [not null]
  description text [not null]
  is_checked boolean [not null, default: false]
  checked_by int
  checked_at timestamp
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table project.checklist_phase {
  id uuid [pk]
  project_technical_id uuid [not null]
  name varchar(150) [not null]
  icon varchar(50)
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table project.epic {
  id uuid [pk]
  project_id uuid [not null]
  title varchar(200) [not null]
  description text
  status project.epic_status_enum [not null, default: 'open']
  owner_id int
  start_date date
  due_date date
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table project.milestone {
  id uuid [pk]
  project_id uuid [not null]
  title varchar(200) [not null]
  description text
  status project.milestone_status_enum [not null, default: 'planned']
  due_date date
  completed_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table project.project {
  id uuid [pk]
  name_en varchar(150)
  name_kh varchar(150)
  short_name_kh varchar(150)
  short_name_en varchar(150) [not null]
  origin varchar(150)
  logo_id int
  type_id int
  status_id int
  priority_id int
  description text
  feature text
  benefit text
  user text
  creator_id int
  status_code int [default: 1]
  start_date date
  end_date date
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    short_name_en [unique, name: 'UQ_2461c4c13b47c67131e004b2dff']
  }
}

Table project.project_challenge {
  id uuid [pk]
  project_id uuid [not null]
  status_id int [not null, default: 1]
  created_by int
  title varchar(255) [not null]
  description text
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (project_id, status_id) [name: 'IDX_da221538e68d36f3c92de1321c']
  }
}

Table project.project_document {
  id uuid [pk]
  project_id uuid [not null]
  parent_document_id uuid
  title varchar(255) [not null]
  content jsonb
  created_by int [not null]
  updated_by int
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table project.project_member {
  id uuid [pk]
  project_id uuid [not null]
  user_id int [not null]
  role_id int [not null, default: 4]
  created_by int
  joined_at timestamp [not null]
  created_at timestamp [not null]

  indexes {
    (project_id, user_id) [unique, name: 'UQ_0d739aa2794632a5a09276afb7a']
  }
}

Table project.project_member_role {
  id int [pk, increment]
  name_kh varchar(100) [not null]
  name_en varchar(100) [not null]
  icon_id int
  creator_id int
  organization_id uuid
  is_active boolean [not null, default: true]
  sort int [not null, default: 0]
  permissions jsonb [not null]
  task_delete_scope project.project_member_role_task_delete_scope_enum [not null, default: 'none']
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (name_en, organization_id) [unique, name: 'UQ_4e747a2d55033d869e1608f83e5']
  }
}

Table project.project_mockup {
  id uuid [pk]
  project_technical_id uuid [not null]
  name varchar(150) [not null]
  device_type varchar(30)
  link varchar(500) [not null]
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table project.project_organization {
  id uuid [pk]
  project_id uuid [not null]
  organization_id uuid [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (project_id, organization_id) [unique, name: 'UQ_b7916be0aabed48f52f51f9282b']
  }
}

Table project.project_priority {
  id int [pk, increment]
  name_en varchar(100) [not null]
  name_kh varchar(100)
  file_id int
  creator_id int
  organization_id uuid
  is_active boolean [not null, default: true]
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (name_en, organization_id) [unique, name: 'UQ_ea00e041c61a6a5b858b36fbe65']
  }
}

Table project.project_service_credential {
  id uuid [pk]
  project_technical_id uuid [not null]
  environment varchar(30) [not null, default: 'dev']
  host varchar(255)
  username varchar(100)
  password_encrypted text
  secret_key_encrypted text
  authorized_ip varchar(255)
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (project_technical_id, environment) [unique, name: 'UQ_9ac666773e7717ba2c2aa73cbf4']
  }
}

Table project.project_status {
  id int [pk, increment]
  name_en varchar(100) [not null]
  name_kh varchar(100)
  file_id int
  creator_id int
  organization_id uuid
  is_active boolean [not null, default: true]
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (name_en, organization_id) [unique, name: 'UQ_d1b0e89bdb68ce84e5a98957434']
  }
}

Table project.project_suggestion {
  id uuid [pk]
  project_id uuid [not null]
  status_id int [not null, default: 1]
  created_by int
  title varchar(255) [not null]
  description text
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (project_id, status_id) [name: 'IDX_bf1337948605d331c97f3a840f']
  }
}

Table project.project_technical {
  id uuid [pk]
  project_id uuid [not null]
  category_id int [not null]
  content jsonb
  is_restricted boolean [not null, default: false]
  created_by int [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (project_id, category_id) [unique, name: 'UQ_9ff673d3b299f60174ccf894e27']
  }
}

Table project.project_technical_member {
  id uuid [pk]
  project_technical_id uuid [not null]
  project_member_id uuid [not null]
  added_by int
  created_at timestamp [not null]

  indexes {
    (project_technical_id, project_member_id) [unique, name: 'UQ_33f2979e5ad4577eb2d56f823ca']
  }
}

Table project.project_technology {
  id uuid [pk]
  project_technical_id uuid [not null]
  name varchar(100) [not null]
  version varchar(50)
  icon_id int
  environment varchar(20)
  gitlab_link varchar(500)
  offical_website varchar(500)
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table project.project_type {
  id int [pk, increment]
  name_en varchar(100) [not null]
  name_kh varchar(100)
  icon_id int
  creator_id int
  organization_id uuid
  is_active boolean [not null, default: true]
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (name_en, organization_id) [unique, name: 'UQ_a02d68e06039510ca02d6f4c36b']
  }
}

Table project.roadmap_item {
  id uuid [pk]
  project_id uuid [not null]
  epic_id uuid
  milestone_id uuid
  title varchar(200) [not null]
  description text
  start_date date
  end_date date
  status project.roadmap_item_status_enum [not null, default: 'planned']
  created_at timestamp [not null]
  updated_at timestamp [not null]
}

Table project.suggestion_status {
  id int [pk, increment]
  name_en varchar(100) [not null]
  name_kh varchar(100) [not null]
  is_active boolean [not null, default: true]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table project.technical_category {
  id int [pk, increment]
  name_en varchar(100) [not null]
  name_kh varchar(100)
  code varchar(50) [not null]
  icon_id int
  is_active boolean [not null, default: true]
  sort int [not null, default: 0]
  creator_id int
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    code [unique, name: 'UQ_0f8fc886acd653c7420f689ce7e']
  }
}

Table report.report {
  id uuid [pk]
  organization_id uuid [not null]
  project_id uuid
  name varchar(150) [not null]
  type report.report_type_enum [not null, default: 'project_summary']
  filters jsonb
  generated_by int [not null]
  data jsonb
  created_at timestamp [not null]
}

Table sprint.sprint {
  id uuid [pk]
  project_id uuid [not null]
  name varchar(150) [not null]
  goal text
  status sprint.sprint_status_enum [not null, default: 'planned']
  start_date date
  end_date date
  completed_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table task.label {
  id uuid [pk]
  project_id uuid [not null]
  name varchar(100) [not null]
  color varchar(30)
  created_at timestamp [not null]
  updated_at timestamp [not null]

  indexes {
    (project_id, name) [unique, name: 'UQ_0cca3edf711c5582d3d75a86449']
  }
}

Table task.task {
  id uuid [pk]
  project_id uuid [not null]
  sprint_id uuid
  epic_id uuid
  parent_task_id uuid
  activity_id uuid
  file_id int
  task_code varchar(50) [not null]
  title varchar(255) [not null]
  description text
  type_id int [not null]
  status_id int
  priority_id int [not null]
  reporter_id int [not null]
  due_date timestamp
  completed_at timestamp
  archive boolean [not null, default: false]
  estimated_minutes int [not null, default: 0]
  story_points int
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (project_id, task_code) [unique, name: 'UQ_dd9394b7848925c35c4f6405efd']
  }
}

Table task.task_activity_log {
  id uuid [pk]
  task_id uuid [not null]
  user_id int
  action varchar(50) [not null]
  field_name varchar(100)
  old_value jsonb
  new_value jsonb
  metadata jsonb
  created_at timestamp [not null]
}

Table task.task_assignee {
  id uuid [pk]
  task_id uuid [not null]
  user_id int [not null]
  assigned_by int
  assigned_at timestamp [not null]

  indexes {
    (task_id, user_id) [unique, name: 'UQ_70f70b519ef8e0de05dac469918']
  }
}

Table task.task_attachment {
  id uuid [pk]
  task_id uuid [not null]
  file_id int [not null]
  uploaded_by_id int [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table task.task_comment {
  id uuid [pk]
  task_id uuid [not null]
  user_id int [not null]
  parent_comment_id uuid
  content text [not null]
  is_edited boolean [not null, default: false]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table task.task_dependency {
  id uuid [pk]
  task_id uuid [not null]
  depends_on_task_id uuid [not null]
  type task.task_dependency_type_enum [not null, default: 'blocks']
  created_at timestamp [not null]

  indexes {
    (task_id, depends_on_task_id) [unique, name: 'UQ_0f2d7856be81553295fe0ab17a5']
  }
}

Table task.task_label {
  task_id uuid [pk]
  label_id uuid [pk]
}

Table task.task_performance_multiplier {
  id uuid [pk]
  task_performance_score_id uuid [not null]
  organization_id uuid [not null]
  ref_table varchar(50) [not null]
  ref_id int [not null]
  multiplier decimal(5,2) [not null]
  created_by int
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table task.task_performance_rank {
  id uuid [pk]
  task_performance_score_id uuid [not null]
  name_en varchar(50) [not null]
  name_kh varchar(50)
  rank_order int [not null]
  start_score decimal(10,2) [not null]
  end_score decimal(10,2) [not null]
  created_by int
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table task.task_performance_score {
  id uuid [pk]
  organization_id uuid [not null]
  total_score decimal(10,2) [not null, default: 120]
  created_by int
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    organization_id [unique, name: 'UQ_eac0b413a0ec5136182eaa7ca38']
  }
}

Table task.task_priority {
  id int [pk, increment]
  name_kh varchar(100) [not null]
  name_en varchar(100) [not null]
  file_id int
  color varchar(30)
  creator_id int
  organization_id uuid
  is_active boolean [not null, default: true]
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (name_en, organization_id) [unique, name: 'UQ_cae9cb79ed95b355bbace646152']
  }
}

Table task.task_reporter {
  id uuid [pk]
  task_id uuid [not null]
  user_id int [not null]
  assigned_by int
  assigned_at timestamp [not null]

  indexes {
    (task_id, user_id) [unique, name: 'UQ_38f7b3b409b7bb1e59fbdf58327']
  }
}

Table task.task_status {
  id int [pk, increment]
  name_kh varchar(100) [not null]
  name_en varchar(100) [not null]
  file_id int
  color varchar(30)
  creator_id int
  organization_id uuid
  is_active boolean [not null, default: true]
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (name_en, organization_id) [unique, name: 'UQ_2d50fc45238033d25ac27848006']
  }
}

Table task.task_type {
  id int [pk, increment]
  name_kh varchar(100) [not null]
  name_en varchar(100) [not null]
  file_id int
  creator_id int
  organization_id uuid
  is_active boolean [not null, default: true]
  sort int [not null, default: 0]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (name_en, organization_id) [unique, name: 'UQ_6b6d3c31fd60e5c28beb89c7dd4']
  }
}

Table task.task_watcher {
  id uuid [pk]
  task_id uuid [not null]
  user_id int [not null]
  created_at timestamp [not null]

  indexes {
    (task_id, user_id) [unique, name: 'UQ_bbb0a9f7d95f2b6a82a267a77b6']
  }
}

Table task.time_log {
  id uuid [pk]
  task_id uuid [not null]
  user_id int [not null]
  description text
  minutes_spent int [not null]
  logged_date date [not null]
  started_at timestamp
  ended_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table user.permission {
  id uuid [pk]
  module varchar(100) [not null]
  action varchar(100) [not null]
  code varchar(150) [not null]
  description text
  created_at timestamp [not null]

  indexes {
    code [unique, name: 'UQ_30e166e8c6359970755c5727a23']
  }
}

Table user.qr_login_session {
  id int [pk, increment]
  user_id int [not null]
  qr_token varchar(100) [not null]
  status varchar(20) [not null, default: 'pending']
  expires_at timestamp [not null]
  used_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]

  indexes {
    qr_token [unique, name: 'UQ_614fa641806c918b96a188fff37']
  }
}

Table user.role {
  id int [pk, increment]
  name_kh varchar(100) [not null]
  name_en varchar(100) [not null]
  slug varchar(100) [not null]
  icon varchar(100)
  color varchar(100)
}

Table user.role_permission {
  role_id int [pk]
  permission_id uuid [pk]
}

Table user.user {
  id int [pk, increment]
  sex_id int [not null]
  name_kh varchar(50) [not null]
  name_en varchar(50) [not null]
  phone varchar(225)
  email varchar(225)
  password varchar(100)
  password_changed_at timestamp
  is_active int [not null, default: 1]
  auth_provider user.user_auth_provider_enum [not null, default: 'local']
  google_id varchar(255)
  email_verified boolean [not null, default: false]
  telegram_id varchar(50)
  telegram_username varchar
  telegram_photo_url varchar(500)
  avatar_id int
  background_id int
  first_name varchar(100)
  last_name varchar(100)
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    google_id [unique, name: 'UQ_7adac5c0b28492eb292d4a93871']
    telegram_id [unique, name: 'UQ_c1ed111fba8a34b812d11f42352']
  }
}

Table user.user_devices {
  id int [pk, increment]
  user_id int [not null]
  device_id varchar(255)
  device_name varchar(255) [not null]
  platform varchar(50) [not null]
  os varchar(50) [not null]
  browser varchar(100) [not null]
  user_agent text
  device_type varchar(50)
  ip varchar(45)
  country_code varchar(10)
  region varchar(100)
  city varchar(100)
  latitude decimal(10,7)
  longitude decimal(10,7)
  timezone varchar(100)
  last_activity_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (user_id, device_id) [unique, name: 'IDX_9c9c9a27cebbd0e71a62144108']
  }
}

Table user.user_otp {
  id int [pk, increment]
  user_id int [not null]
  otp varchar(6) [not null]
  otp_token varchar(100)
  purpose varchar(30)
  channel varchar(20)
  expires_at timestamp [not null]
}

Table user.user_otp_setting {
  id int [pk, increment]
  user_id int [not null]
  phone_enabled boolean [not null, default: false]
  telegram_enabled boolean [not null, default: false]
  email_enabled boolean [not null, default: false]
  created_at timestamp [not null]
  updated_at timestamp [not null]

  indexes {
    user_id [unique, name: 'UQ_b37274d65150e5c02372ed2c0a6']
  }
}

Table user.user_role {
  id int [pk, increment]
  user_id int [not null]
  role_id int [not null]
  organization_id uuid
  is_default boolean [not null, default: false]
  deleted_at timestamp

  indexes {
    user_id [unique, name: 'UQ_user_role_one_default']
    (user_id, role_id, organization_id) [unique, name: 'UQ_user_role_with_org']
    (user_id, role_id) [unique, name: 'UQ_user_role_no_org']
  }
}

Table user.user_session {
  id int [pk, increment]
  user_id int [not null]
  user_device_id int [not null]
  ip varchar(45)
  country_code varchar(10)
  region varchar(100)
  city varchar(100)
  latitude decimal(10,7)
  longitude decimal(10,7)
  timezone varchar(50)
  login_method int [not null, default: 1]
  is_active boolean [not null, default: true]
  restricted_attempt boolean [not null, default: false]
  last_activity_at timestamp
  logged_out_at timestamp
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Table user.user_session_log {
  id int [pk, increment]
  user_id int [not null]
  user_device_id int [not null]
  device_id varchar(255)
  ip varchar(45)
  country_code varchar(10)
  region varchar(100)
  city varchar(100)
  latitude decimal(10,7)
  longitude decimal(10,7)
  timezone varchar(100)
  device_name varchar(255)
  platform varchar(50)
  os varchar(50)
  browser varchar(100)
  device_type varchar(50)
  user_agent text
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

Ref: activity.activity.created_by > user.user.id [delete: set null]
Ref: activity.activity.organization_id > organization.organization.id [delete: cascade]
Ref: activity.activity.project_id > project.project.id [delete: cascade]
Ref: activity.activity.status_id > activity.activity_status.id [delete: set null]
Ref: activity.activity_assignee.activity_id > activity.activity.id [delete: cascade]
Ref: activity.activity_assignee.user_id > user.user.id [delete: cascade]
Ref: activity.activity_attachment.activity_id > activity.activity.id [delete: cascade]
Ref: activity.activity_attachment.file_id > file.file.id [delete: cascade]
Ref: activity.activity_attachment.uploaded_by_id > user.user.id [delete: cascade]
Ref: activity.activity_status.file_id > file.file.id [delete: set null]
Ref: application.application.end_day_of_week_id > application.days_in_week.id [delete: restrict]
Ref: application.application.start_day_of_week_id > application.days_in_week.id [delete: restrict]
Ref: application.application_funtional.file_id > file.file.id [delete: set null]
Ref: audit.audit_log.organization_id > organization.organization.id [delete: set null]
Ref: audit.audit_log.user_id > user.user.id [delete: set null]
Ref: chat.chat_attachment.file_id > file.file.id [delete: cascade]
Ref: chat.chat_attachment.message_id > chat.chat_message.id [delete: cascade]
Ref: chat.chat_attachment.uploaded_by_id > user.user.id [delete: cascade]
Ref: chat.chat_member.last_read_message_id > chat.chat_message.id [delete: set null]
Ref: chat.chat_member.room_id > chat.chat_room.id [delete: cascade]
Ref: chat.chat_member.user_id > user.user.id [delete: cascade]
Ref: chat.chat_message.file_id > file.file.id [delete: set null]
Ref: chat.chat_message.parent_message_id > chat.chat_message.id [delete: cascade]
Ref: chat.chat_message.room_id > chat.chat_room.id [delete: cascade]
Ref: chat.chat_message.sender_id > user.user.id [delete: set null]
Ref: chat.chat_room.created_by_id > user.user.id [delete: cascade]
Ref: chat.chat_room.meeting_id > meeting.meeting.id [delete: cascade]
Ref: chat.chat_room.organization_id > organization.organization.id [delete: cascade]
Ref: chat.chat_room.project_id > project.project.id [delete: cascade]
Ref: chat.chat_room.task_id > task.task.id [delete: cascade]
Ref: custom_field.custom_field.organization_id > organization.organization.id [delete: cascade]
Ref: custom_field.custom_field.project_id > project.project.id [delete: cascade]
Ref: custom_field.custom_field_value.custom_field_id > custom_field.custom_field.id [delete: cascade]
Ref: file.project_file_folder.created_by > user.user.id [delete: set null]
Ref: file.project_file_folder.parent_id > file.project_file_folder.id [delete: cascade]
Ref: file.project_file_folder.project_id > project.project.id [delete: cascade]
Ref: meeting.meeting.organizer_id > user.user.id [delete: cascade]
Ref: meeting.meeting.project_id > project.project.id [delete: cascade]
Ref: meeting.meeting_participant.meeting_id > meeting.meeting.id [delete: cascade]
Ref: meeting.meeting_participant.user_id > user.user.id [delete: cascade]
Ref: notification.notification.activity_id > activity.activity.id [delete: cascade]
Ref: notification.notification.organization_id > organization.organization.id [delete: cascade]
Ref: notification.notification.project_id > project.project.id [delete: cascade]
Ref: notification.notification.task_id > task.task.id [delete: cascade]
Ref: notification.notification.user_id > user.user.id [delete: cascade]
Ref: organization.organization.background_logo_id > file.file.id [delete: set null]
Ref: organization.organization.logo_id > file.file.id [delete: set null]
Ref: organization.organization.owner_id > user.user.id [delete: cascade]
Ref: organization.organization_member.organization_id > organization.organization.id [delete: cascade]
Ref: organization.organization_member.user_id > user.user.id [delete: cascade]
Ref: organization.organization_position.creator_id > user.user.id [delete: set null]
Ref: organization.organization_position.icon_id > file.file.id [delete: set null]
Ref: organization.organization_position.organization_id > organization.organization.id [delete: cascade]
Ref: project.checklist_item.checked_by > user.user.id [delete: set null]
Ref: project.checklist_item.checklist_phase_id > project.checklist_phase.id [delete: cascade]
Ref: project.checklist_phase.project_technical_id > project.project_technical.id [delete: cascade]
Ref: project.epic.owner_id > user.user.id [delete: set null]
Ref: project.epic.project_id > project.project.id [delete: cascade]
Ref: project.milestone.project_id > project.project.id [delete: cascade]
Ref: project.project.creator_id > user.user.id [delete: cascade]
Ref: project.project.logo_id > file.file.id [delete: set null]
Ref: project.project.priority_id > project.project_priority.id [delete: set null]
Ref: project.project.status_id > project.project_status.id [delete: set null]
Ref: project.project.type_id > project.project_type.id [delete: set null]
Ref: project.project_challenge.created_by > user.user.id [delete: set null]
Ref: project.project_challenge.project_id > project.project.id [delete: cascade]
Ref: project.project_document.created_by > user.user.id [delete: cascade]
Ref: project.project_document.parent_document_id > project.project_document.id [delete: cascade]
Ref: project.project_document.project_id > project.project.id [delete: cascade]
Ref: project.project_document.updated_by > user.user.id [delete: set null]
Ref: project.project_member.project_id > project.project.id [delete: cascade]
Ref: project.project_member.user_id > user.user.id [delete: cascade]
Ref: project.project_member_role.creator_id > user.user.id [delete: set null]
Ref: project.project_member_role.icon_id > file.file.id [delete: set null]
Ref: project.project_member_role.organization_id > organization.organization.id [delete: cascade]
Ref: project.project_mockup.project_technical_id > project.project_technical.id [delete: cascade]
Ref: project.project_organization.organization_id > organization.organization.id [delete: cascade]
Ref: project.project_organization.project_id > project.project.id [delete: cascade]
Ref: project.project_priority.creator_id > user.user.id [delete: set null]
Ref: project.project_priority.file_id > file.file.id [delete: set null]
Ref: project.project_priority.organization_id > organization.organization.id [delete: cascade]
Ref: project.project_service_credential.project_technical_id > project.project_technical.id [delete: cascade]
Ref: project.project_status.creator_id > user.user.id [delete: set null]
Ref: project.project_status.file_id > file.file.id [delete: set null]
Ref: project.project_status.organization_id > organization.organization.id [delete: cascade]
Ref: project.project_suggestion.created_by > user.user.id [delete: set null]
Ref: project.project_suggestion.project_id > project.project.id [delete: cascade]
Ref: project.project_technical.category_id > project.technical_category.id [delete: restrict]
Ref: project.project_technical.created_by > user.user.id [delete: set null]
Ref: project.project_technical.project_id > project.project.id [delete: cascade]
Ref: project.project_technical_member.added_by > user.user.id [delete: set null]
Ref: project.project_technical_member.project_member_id > project.project_member.id [delete: cascade]
Ref: project.project_technical_member.project_technical_id > project.project_technical.id [delete: cascade]
Ref: project.project_technology.icon_id > file.file.id [delete: set null]
Ref: project.project_technology.project_technical_id > project.project_technical.id [delete: cascade]
Ref: project.project_type.creator_id > user.user.id [delete: set null]
Ref: project.project_type.icon_id > file.file.id [delete: set null]
Ref: project.project_type.organization_id > organization.organization.id [delete: cascade]
Ref: project.roadmap_item.epic_id > project.epic.id [delete: set null]
Ref: project.roadmap_item.milestone_id > project.milestone.id [delete: set null]
Ref: project.roadmap_item.project_id > project.project.id [delete: cascade]
Ref: project.technical_category.creator_id > user.user.id [delete: set null]
Ref: project.technical_category.icon_id > file.file.id [delete: set null]
Ref: report.report.generated_by > user.user.id [delete: cascade]
Ref: report.report.organization_id > organization.organization.id [delete: cascade]
Ref: report.report.project_id > project.project.id [delete: cascade]
Ref: sprint.sprint.project_id > project.project.id [delete: cascade]
Ref: task.label.project_id > project.project.id [delete: cascade]
Ref: task.task.activity_id > activity.activity.id [delete: set null]
Ref: task.task.epic_id > project.epic.id [delete: set null]
Ref: task.task.file_id > file.file.id [delete: set null]
Ref: task.task.parent_task_id > task.task.id [delete: set null]
Ref: task.task.project_id > project.project.id [delete: cascade]
Ref: task.task.reporter_id > user.user.id [delete: cascade]
Ref: task.task.sprint_id > sprint.sprint.id [delete: set null]
Ref: task.task_activity_log.task_id > task.task.id [delete: cascade]
Ref: task.task_activity_log.user_id > user.user.id [delete: set null]
Ref: task.task_assignee.assigned_by > user.user.id [delete: set null]
Ref: task.task_assignee.task_id > task.task.id [delete: cascade]
Ref: task.task_assignee.user_id > user.user.id [delete: cascade]
Ref: task.task_attachment.file_id > file.file.id [delete: cascade]
Ref: task.task_attachment.task_id > task.task.id [delete: cascade]
Ref: task.task_attachment.uploaded_by_id > user.user.id [delete: cascade]
Ref: task.task_comment.parent_comment_id > task.task_comment.id [delete: cascade]
Ref: task.task_comment.task_id > task.task.id [delete: cascade]
Ref: task.task_comment.user_id > user.user.id [delete: cascade]
Ref: task.task_dependency.depends_on_task_id > task.task.id [delete: cascade]
Ref: task.task_dependency.task_id > task.task.id [delete: cascade]
Ref: task.task_label.label_id > task.label.id [delete: cascade]
Ref: task.task_label.task_id > task.task.id [delete: cascade]
Ref: task.task_performance_multiplier.created_by > user.user.id [delete: set null]
Ref: task.task_performance_multiplier.organization_id > organization.organization.id [delete: cascade]
Ref: task.task_performance_multiplier.task_performance_score_id > task.task_performance_score.id [delete: cascade]
Ref: task.task_performance_rank.created_by > user.user.id [delete: set null]
Ref: task.task_performance_rank.task_performance_score_id > task.task_performance_score.id [delete: cascade]
Ref: task.task_performance_score.created_by > user.user.id [delete: set null]
Ref: task.task_performance_score.organization_id > organization.organization.id [delete: cascade]
Ref: task.task_priority.creator_id > user.user.id [delete: set null]
Ref: task.task_priority.file_id > file.file.id [delete: set null]
Ref: task.task_priority.organization_id > organization.organization.id [delete: cascade]
Ref: task.task_reporter.assigned_by > user.user.id [delete: set null]
Ref: task.task_reporter.task_id > task.task.id [delete: cascade]
Ref: task.task_reporter.user_id > user.user.id [delete: cascade]
Ref: task.task_status.creator_id > user.user.id [delete: set null]
Ref: task.task_status.file_id > file.file.id [delete: set null]
Ref: task.task_status.organization_id > organization.organization.id [delete: cascade]
Ref: task.task_type.creator_id > user.user.id [delete: set null]
Ref: task.task_type.file_id > file.file.id [delete: set null]
Ref: task.task_type.organization_id > organization.organization.id [delete: cascade]
Ref: task.task_watcher.task_id > task.task.id [delete: cascade]
Ref: task.task_watcher.user_id > user.user.id [delete: cascade]
Ref: task.time_log.task_id > task.task.id [delete: cascade]
Ref: task.time_log.user_id > user.user.id [delete: cascade]
Ref: user.qr_login_session.user_id > user.user.id [delete: cascade]
Ref: user.role_permission.permission_id > user.permission.id [delete: cascade]
Ref: user.role_permission.role_id > user.role.id [delete: cascade]
Ref: user.user.avatar_id > file.file.id [delete: set null]
Ref: user.user.background_id > file.file.id [delete: set null]
Ref: user.user_devices.user_id > user.user.id [delete: cascade]
Ref: user.user_otp.user_id > user.user.id [delete: cascade]
Ref: user.user_otp_setting.user_id > user.user.id [delete: cascade]
Ref: user.user_role.organization_id > organization.organization.id [delete: cascade]
Ref: user.user_role.role_id > user.role.id [delete: cascade]
Ref: user.user_role.user_id > user.user.id [delete: cascade]
Ref: user.user_session.user_device_id > user.user_devices.id [delete: cascade]
Ref: user.user_session.user_id > user.user.id [delete: cascade]
Ref: user.user_session_log.user_device_id > user.user_devices.id [delete: cascade]
Ref: user.user_session_log.user_id > user.user.id [delete: cascade]
```

_Generated table count: 76. Generated relation count: 168. Generated enum count: 17._
