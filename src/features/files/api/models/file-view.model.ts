import { FileMetadata } from '../../domain/entities/file-metadata.entity';

export const filesBlogMetaViewModel = (
  wallpaperInfo: RawImageMetaType,
  mainImages: FileMetadata[],
): FilesMetaBlogViewModelType => ({
  wallpaper: wallpaperInfo
    ? {
        url: wallpaperInfo?.fileUrl || null,
        width: wallpaperInfo?.fileWidth || 0,
        height: wallpaperInfo?.fileHeight || 0,
        fileSize: wallpaperInfo?.fileSize || 0,
      }
    : null,
  main: mainImages?.length ? mainImages.map(processMainPhotos) : [],
});

const processMainPhotos = (mainImage: FileMetadata) => ({
  url: mainImage?.fileUrl || null,
  width: mainImage?.fileWidth || 0,
  height: mainImage?.fileHeight || 0,
  fileSize: mainImage?.fileSize || 0,
});

export const filesBlogPostMetaViewModel = (
  mainImages: FileMetadata[],
): FileMetaPostViewModelType => ({
  main: mainImages?.length ? mainImages.map(processMainPhotos) : [],
});

export type ContentCharacters = {
  url: string;
  width: number;
  height: number;
  fileSize: number;
};
export type RawImageMetaType = {
  fileUrl: string;
  fileWidth: number;
  fileHeight: number;
  fileSize: number;
};

export type FilesMetaBlogViewModelType = {
  wallpaper: ContentCharacters;
  main: ContentCharacters[];
};

export type FileMetaPostViewModelType = Omit<
  FilesMetaBlogViewModelType,
  'wallpaper'
>;
