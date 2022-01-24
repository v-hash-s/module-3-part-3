import { createClient } from "pexels";
import { getEnv } from "@helper/environment";

const client = createClient(getEnv("PEXELS_API_KEY"));

export class PexelsService {
  private readonly query: string;
  private readonly limit: number;
  private readonly client;

  constructor(event?, client?) {
    this.query = event?.queryStringParameters.query;
    this.limit = event?.queryStringParameters.limit ?? 10;
    this.client = client;
  }

  async getPexelsPhotosByQuery(query, limit) {
    const photos = await client.photos.search({
      query: query,
      per_page: limit,
    });
    return photos;
  }

  async getPexelsPhotosByIds(ids) {
    const photosIds = await Promise.all(
      ids.map(async (id) => {
        return await client.photos.show({ id: id });
      })
    );

    return photosIds;
  }
}
