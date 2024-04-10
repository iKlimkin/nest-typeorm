import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import { aDescribe } from "../tools/utils/aDescribe";
import { initSettings } from "../tools/utils/initSettings";
import { skipSettings } from "../tools/utils/testsSettings";
import { UsersTestManager } from "../tools/managers/UsersTestManager";

aDescribe(skipSettings.for('quiz'))('SAQuizController (e2e)', () => {
    let app: INestApplication;
    let usersTestManager: UsersTestManager
    let dataSource: DataSource;
  
    beforeAll(async () => {
      const result = await initSettings();
  
      app = result.app;

      usersTestManager = result.usersTestManager;
      dataSource = result.testingAppModule.get<DataSource>(DataSource);
    });
  
    afterAll(async () => {
      await app.close();
    });

    describe('GET /sa/quiz/questions', () => {
        it('', async () => {

        })

    })
    describe('POST /sa/quiz/questions', () => {
        it(`Shouldn't create question with incorrect input model, 400`, async () => {
            
        })
        it(`Shouldn't create question without authorization, 400`, async () => {
            
        })
        it(`Should create question, 201`, async () => {
            
        })
    })
    describe('DELETE /sa/quiz/questions', () => {})
    describe('PUT /sa/quiz/questions/id', () => {})
    describe('PUT /sa/quiz/questions/id/publish', () => {})
})