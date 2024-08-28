import { DataSource, EntityManager } from 'typeorm';
import { LayerNoticeInterceptor } from '../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../infra/utils/interlay-error-handler.ts/error-constants';

export async function runInTransaction<T>(
  dataSource: DataSource,
  operation: (manager: EntityManager) => Promise<LayerNoticeInterceptor<T>>,
): Promise<LayerNoticeInterceptor<T>> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  const manager = queryRunner.manager;

  await queryRunner.startTransaction();

  try {
    const result = await operation(manager);

    if (result.hasError) {
      await queryRunner.rollbackTransaction();
      console.log(
        `Transaction rolled back with error: ${result.extensions[0]?.message}`,
      );
      return result;
    }
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    console.warn({ error: error.message });
    await queryRunner.rollbackTransaction();
    const notice = new LayerNoticeInterceptor();
    notice.addError(
      error?.message || 'unexpected error',
      'runInTransaction',
      GetErrors.Transaction,
    );

    return notice;
  } finally {
    await queryRunner.release();
  }
}
