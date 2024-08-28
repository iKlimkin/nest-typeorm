import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../settings/config/configuration';

@Injectable()
export class CaptureAdapter {
  private secretKey: string;
  constructor(private configService: ConfigService<ConfigurationType>) {
    this.secretKey = this.configService.get('google', {
      infer: true,
    }).capture_secret;
  }
  async isValid(captureRaw: string) {
    try {
      fetch('https://www.google.com/recaptcha/api/siteverify', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: `secret=${this.secretKey}&response=${captureRaw}`,
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            return true;
          } else {
            return false;
          }
        });
      const rawResult = await fetch(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          method: 'POST',
          body: `secret=${this.secretKey}&response=${captureRaw}`,
        },
      );

      const response: RecaptchaResponse = await rawResult.json();

      if (!response.success || response.score < 0.5) return false;

      return true;
    } catch (error) {
      console.error('Failed to verify captcha', error);
      return false;
    }
  }
}

type RecaptchaResponse = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  score: number;
  action: string;
  'error-codes': string[];
};
