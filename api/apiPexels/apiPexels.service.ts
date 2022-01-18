import { log } from "../../helper/logger";

export class PexelsService {
  private readonly query: string;
  private readonly limit: number;
  private readonly client;

  constructor(event, client) {
    this.query = event.queryStringParameters.query;
    this.limit = event.queryStringParameters.limit ?? 10;
    this.client = client;
    log("query from constructor: ", this.query);
    log("limit from constructor: ", this.limit);
  }

  async getPexelsPhotos() {
    const photos = await this.client.photos.search({
      query: this.query,
      per_page: this.limit,
    });
    return photos;
  }
}
