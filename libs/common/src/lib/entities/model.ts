import { STFUtils } from '@flaps/core';
import { EntitiesGroup } from '@nuclia/core';
import { cloneDeep } from '@flaps/common';

export const generatedEntitiesColor: { [key: string]: string } = {
  DATE: '#FF8989',
  EVENT: '#CBA2DA',
  FAC: '#81D8AC',
  GPE: '#6EB0EC',
  LANGUAGE: '#D1D3FF',
  LAW: '#9295E7',
  LOC: '#D1BEA9',
  MAIL: '#D2F1E1',
  MONEY: '#FF8C4B',
  NORP: '#CFE8FF',
  ORG: '#A0E3FF',
  PERCENT: '#FBDBB9',
  PERSON: '#FFDA69',
  PRODUCT: '#FF6363',
  QUANTITY: '#E7D2EF',
  TIME: '#21B8A6',
  WORK_OF_ART: '#ffc7c7',
};

export interface Entity {
  value: string;
  merged?: boolean;
  represents?: string[];
}

export class AppEntitiesGroup {
  key: string;
  title?: string;
  color?: string;
  entities: { [entityName: string]: Entity };

  constructor(group: EntitiesGroup, key: string) {
    this.key = key;
    this.title = group.title;
    this.color = group.color;
    this.entities = group.entities;
  }

  getEntity(value: string): Entity | undefined {
    return this.getEntityList().find((entity) => entity.value === value);
  }

  getEntities(entityValues: string[]): Entity[] {
    return entityValues.map((value) => this.getEntity(value)).filter((entity) => !!entity) as Entity[];
  }

  getEntityList(): Entity[] {
    return Object.values(this.entities);
  }

  getSynonyms(entityValue: string): Entity[] {
    const synonyms = this.getEntity(entityValue)?.represents;
    return synonyms ? this.getEntities(synonyms) : [];
  }
}

export class MutableEntitiesGroup extends AppEntitiesGroup {
  constructor(group: EntitiesGroup, key: string) {
    super(group, key);
    // Enforce deep copy
    this.entities = cloneDeep(group.entities);
  }

  addEntity(value: string): Entity {
    const key = STFUtils.generateUniqueSlug(value, Object.keys(this.entities));
    const newEntity = { value };
    if (!this.entities) {
      this.entities = {};
    }
    this.entities[key] = newEntity;
    return newEntity;
  }

  addSynonym(entityValue: string, synonymValue: string): void {
    const entity = this.getEntity(entityValue);
    const synonym = this.getEntity(synonymValue);

    if (entity && synonym && entity.value !== synonym.value && !entity.represents?.includes(synonymValue)) {
      entity.represents ? entity.represents.push(synonymValue) : (entity.represents = [synonymValue]);

      // If the synonym has synonyms, add them too
      synonym.represents?.forEach((synonymValue) => {
        this.addSynonym(entityValue, synonymValue);
      });

      synonym.merged = true;
      synonym.represents = [];
    }
  }

  unlinkSynonym(entityValue: string, synonymValue: string): void {
    const entity = this.getEntity(entityValue);
    const synonym = this.getEntity(synonymValue);
    if (entity && synonym) {
      if (entity.represents?.includes(synonymValue)) {
        entity.represents = entity.represents.filter((value) => value !== synonymValue);
        synonym.merged = false;
      }
    }
  }

  deleteEntity(entityValue: string): void {
    if (!this.entities) return;
    const key = Object.keys(this.entities).find((key) => this.entities![key].value === entityValue);
    if (key) {
      const entity = this.entities[key];

      // If the entity has synonyms, delete them too
      if (!entity.merged && entity.represents && entity.represents.length > 0) {
        entity.represents.forEach((synonym) => {
          this.deleteEntity(synonym);
        });
      }

      // If the entity is a synonym, unlink it first
      if (entity.merged) {
        const parentEntity = this.getEntityList().find((entity) => entity.represents?.includes(entity.value));
        if (parentEntity) {
          this.unlinkSynonym(parentEntity.value, entity.value);
        }
      }

      delete this.entities[key];
    }
  }

  getCopy(): EntitiesGroup {
    return {
      title: this.title,
      color: this.color,
      entities: cloneDeep(this.entities),
    };
  }
}
