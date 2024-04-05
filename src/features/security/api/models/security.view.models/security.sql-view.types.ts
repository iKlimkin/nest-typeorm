export interface UserSqlSession {
    id: string;
    ip: string;
    user_agent_info: string;
    user_id: string;
    device_id: string;
    refresh_token: string;
    rt_issued_at: Date;
    rt_expiration_date: Date;
    created_at: Date;
  }

  export interface UserSqlSessionDTO extends Omit<UserSqlSession, 'created_at' | 'id'> {}