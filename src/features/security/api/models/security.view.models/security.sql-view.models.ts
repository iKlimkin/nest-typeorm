import { UserSession } from "../../../domain/entities/security.entity";
import { UserSqlSession } from "./security.sql-view.types";
import { SecurityViewDeviceModel } from "./security.view.types";

export const getSqlSessionViewModel = (
    session: UserSqlSession,
  ): SecurityViewDeviceModel => ({
    ip: session.ip,
    title: session.user_agent_info,
    lastActiveDate: session.rt_issued_at.toISOString(),
    deviceId: session.device_id,
  });

export const getTORSessionViewModel = (
    session: UserSession,
  ): SecurityViewDeviceModel => ({
    ip: session.ip,
    title: session.user_agent_info,
    lastActiveDate: session.rt_issued_at.toISOString(),
    deviceId: session.device_id,
  });