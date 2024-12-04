import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesPage } from './features.page';

describe('FeaturesPage', () => {
  let component: FeaturesPage;
  let fixture: ComponentFixture<FeaturesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FeaturesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
