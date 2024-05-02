import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { LayerNoticeInterceptor } from '../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

export async function runInTransaction<T>(
  dataSource: DataSource,
  operation: (manager: EntityManager) => Promise<LayerNoticeInterceptor<T>>
): Promise<LayerNoticeInterceptor<T>> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  const manager = queryRunner.manager;

  await queryRunner.startTransaction();

  try {
    const result = await operation(manager);

    if (result.hasError) {
      await queryRunner.rollbackTransaction();
      console.log(`Transaction rolled back with error: ${result.extensions[0].message}` );
      return result;
    }

    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.log(`${error}`);
  } finally {
    await queryRunner.release();
  }
}
