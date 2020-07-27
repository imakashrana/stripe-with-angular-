import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCreditsComponent } from './my-credits.component';

describe('MyCreditsComponent', () => {
  let component: MyCreditsComponent;
  let fixture: ComponentFixture<MyCreditsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyCreditsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyCreditsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
