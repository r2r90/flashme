import { Flash } from '@prisma/client';

/**
 * Command for creating a flash.
 */
export interface CreateFlashCommand {
  tenantId: string;
  artistId: string;
  title: string;
  description?: string;
  imageUrl: string;
  price: number;
}

/**
 * Flash with artist info for catalogue views.
 */
export interface FlashWithArtist extends Flash {
  artist: {
    id: string;
    bio: string | null;
    user: { email: string };
  };
}
