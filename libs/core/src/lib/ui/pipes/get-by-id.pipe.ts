import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getById',
  pure: false,
})
export class GetByIdPipe implements PipeTransform {
  transform(value: any[], id: number, property: string): any {
    const foundItem = value.find((item) => {
      if (item.id !== undefined) {
        return item.id === id;
      }

      return false;
    });

    if (foundItem) {
      return foundItem[property];
    }
  }
}
