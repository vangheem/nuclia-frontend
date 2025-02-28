import { Component } from '@angular/core';
import { UserService } from '@flaps/core';

@Component({
  selector: 'app-setup-farewell',
  templateUrl: './farewell.component.html',
  styleUrls: ['./farewell.component.scss'],
})
export class FarewellComponent {
  userPrefs = this.userService.userPrefs;
  constructor(private userService: UserService) {}
}
