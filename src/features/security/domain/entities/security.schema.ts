import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { InputSessionData } from '../../api/models/security-input.models/create.session.type';
import { SecurityDeviceType } from '../../api/models/security.view.models/security.view.types';

@Schema()
export class Security implements SecurityDeviceType {
  @Prop({ required: true })
  ip: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop({ required: true })
  issuedAt: string;

  @Prop({ required: true })
  expirationDate: string;

  static makeInstance(dto: InputSessionData): SecurityDocument {
    const security = new this() as SecurityDocument;
    security.ip = dto.ip;
    security.title = `Device type: ${dto.deviceType}, Application: ${dto.browser}`;
    security.userId = dto.userId;
    security.deviceId = dto.userPayload.deviceId;
    security.refreshToken = dto.refreshToken;
    security.issuedAt = new Date(dto.userPayload.iat! * 1000).toISOString();
    security.expirationDate = new Date(
      dto.userPayload.exp! * 1000,
    ).toISOString();

    return security;
  }
}

export const SecuritySchema = SchemaFactory.createForClass(Security);

export type SecurityDocument = HydratedDocument<Security>;
export type SecurityModelType = Model<SecurityDocument> &
  SecurityModelStaticType;
export type SecurityModelDocumentType = Model<SecurityDocument>;

export const SecurityStaticMethods = {
  makeInstance: Security.makeInstance,
};

SecuritySchema.statics = SecurityStaticMethods;

type SecurityModelStaticType = typeof SecurityStaticMethods;
