import type { IStorageAdapter, PaginationOptions } from '@domain/interfaces/IStorageAdapter';
import type { ICryptoService } from '@domain/interfaces/ICryptoService';
import type { Story, StoryId } from '@domain/models/Story';
import type { EncryptedEnvelope } from '@domain/models/EncryptedEnvelope';
import { VaultLockedError } from '@domain/errors';

export class StoryRepository {
  constructor(
    private storage: IStorageAdapter,
    private crypto: ICryptoService,
    private getKey: () => CryptoKey | null,
  ) {}

  private requireKey(): CryptoKey {
    const key = this.getKey();
    if (!key) throw new VaultLockedError();
    return key;
  }

  private async storyToEnvelope(
    story: Story,
    key: CryptoKey,
  ): Promise<EncryptedEnvelope> {
    const { ciphertextBase64, ivBase64 } = await this.crypto.encrypt(story, key);
    return {
      id: story.id,
      type: 'story',
      ciphertextBase64,
      ivBase64,
      createdAt: story.createdAt,
      updatedAt: story.createdAt,
    };
  }

  private async envelopeToStory(
    envelope: EncryptedEnvelope,
    key: CryptoKey,
  ): Promise<Story> {
    return this.crypto.decrypt<Story>(
      envelope.ciphertextBase64,
      envelope.ivBase64,
      key,
    );
  }

  async save(story: Story): Promise<void> {
    const key = this.requireKey();
    const envelope = await this.storyToEnvelope(story, key);
    await this.storage.put(envelope);
  }

  async findById(id: StoryId): Promise<Story | undefined> {
    const key = this.requireKey();
    const envelope = await this.storage.get(id);
    if (!envelope) return undefined;
    return this.envelopeToStory(envelope, key);
  }

  async findAll(options?: PaginationOptions): Promise<Story[]> {
    const key = this.requireKey();
    const envelopes = await this.storage.listByType('story', options);
    return Promise.all(envelopes.map((e) => this.envelopeToStory(e, key)));
  }

  async delete(id: StoryId): Promise<void> {
    await this.storage.delete(id);
  }
}
