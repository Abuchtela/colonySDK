import { Array, Number, Record, Static, String } from 'runtypes';
import fetch from 'cross-fetch';
import wrapFetch from 'fetch-retry';

const fetchRetry = wrapFetch(fetch);

const IPFS_METADATA = {
  'Annotation(address,bytes32,string)': Record({
    annotationMessage: String,
  }),
  'ColonyMetadata(address,string)': Record({
    colonyDisplayName: String,
    colonyAvatarHash: String,
    colonyTokens: Array(String),
  }),
  'DomainMetadata(address,uint256,string)': Record({
    domainName: String,
    domainColor: Number,
    domainPurpose: String,
  }),
};

export type MetadataKey = keyof typeof IPFS_METADATA;
export type MetadataValue<T extends MetadataKey> = Static<
  typeof IPFS_METADATA[T]
>;
export type AnyMetadataValue = Static<typeof IPFS_METADATA[MetadataKey]>;

const DEFAULT_IPFS_ENDPOINT = 'https://gateway.pinata.cloud/ipfs/';

export interface IpfsOptions {
  endpoint: string;
}

export class IpfsMetadata {
  private ipfsEndpoint: string;

  constructor(options?: IpfsOptions) {
    this.ipfsEndpoint = options?.endpoint || DEFAULT_IPFS_ENDPOINT;
  }

  static eventSupportMetadata(eventName: string) {
    if (eventName in IPFS_METADATA) {
      return true;
    }
    return false;
  }

  async getMetadataForEvent<T extends MetadataKey>(
    eventName: T,
    ipfsCid: string,
  ): Promise<MetadataValue<T>> {
    const res = await fetchRetry(`${this.ipfsEndpoint}${ipfsCid}`, {
      headers: {
        Accept: 'application/json',
      },
      retryOn: [404, 503],
      retries: 3,
      retryDelay: 5000,
    });
    try {
      const data = await res.json();
      // HACK: AAAH FIX for domainColor sometimes being a string and sometimes a number
      if ('domainColor' in data) {
        data.domainColor = parseInt(data.domainColor, 10);
      }
      return IPFS_METADATA[eventName].check(data);
    } catch (e) {
      throw new Error(
        `Could not parse IPFS metadata. Original error: ${
          (e as Error).message
        }`,
      );
    }
  }
}
