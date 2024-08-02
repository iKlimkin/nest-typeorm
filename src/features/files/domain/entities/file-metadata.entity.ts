import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import { LayerNoticeInterceptor } from '../../../posts/api/controllers';
import { BlogImage } from './blog-images.entity';
import { PostImage } from './post-images.entity';

@Entity()
// @Unique(['fileId'])
export class FileMetadata extends BaseEntity {
  @Column()
  fileName: string;

  @Column()
  fileSize: number;

  @Column()
  fileType: string;

  @Column()
  fileUrl: string;

  @Column('uuid')
  fileId: string;

  @Column()
  fileWidth: number;

  @Column()
  fileHeight: number;

  @Column()
  photoType: PhotoType;

  @Column()
  photoSizeType: PhotoSizeType;

  @ManyToOne(() => PostImage, (postImages) => postImages.mainImages)
  @JoinColumn({ name: 'postImgId' })
  postImage: PostImage;
  @Column({ nullable: true })
  postImgId: string;

  @ManyToOne(() => BlogImage, (blogImages) => blogImages.images)
  @JoinColumn({ name: 'blogImgId' })
  blogImage: BlogImage;
  @Column({ nullable: true })
  blogImgId: string;

  static async createMetadata(fileMetadataDto: Partial<FileMetadata>) {
    const notice = new LayerNoticeInterceptor<FileMetadata>();

    const newFileMetadata = new FileMetadata();
    Object.assign(newFileMetadata, fileMetadataDto);

    await notice.validateFields(newFileMetadata);
    notice.addData(newFileMetadata);
    return notice;
  }
}

export enum PhotoType {
  WALLPAPER = 'wallpaper',
  AVATAR = 'avatar',
  MAIN = 'main',
}

export enum EntityType {
  BLOG = 'blog',
  POST = 'post',
  COMMENT = 'comment',
}

export enum PhotoSizeType {
  ORIGINAL = 'original',
  MIDDLE = 'middle',
  SMALL = 'small',
}
