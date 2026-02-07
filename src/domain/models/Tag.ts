/**
 * Tag domain model.
 *
 * Used to categorize and filter journal entries.
 */

export type TagId = string; // UUIDv4

export interface Tag {
  readonly id: TagId;
  name: string;
  color: string; // Hex color code e.g. '#3b82f6'
}

/** Factory: create a new Tag */
export function createTag(params: Pick<Tag, 'id' | 'name'> & Partial<Pick<Tag, 'color'>>): Tag {
  return {
    id: params.id,
    name: params.name,
    color: params.color ?? '#3b82f6', // Default blue
  };
}
