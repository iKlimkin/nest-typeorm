import { AuthController, SAController, SecurityController } from '.';

export const authControllers = [
  AuthController,
  SecurityController,
  SAController,
];

export const controllers = [...authControllers];
