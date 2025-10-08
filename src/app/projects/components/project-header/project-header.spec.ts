import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectHeader } from './project-header';

describe('ProjectHeader', () => {
  let component: ProjectHeader;
  let fixture: ComponentFixture<ProjectHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render Projects heading', () => {
    const h1Element = fixture.nativeElement.querySelector('h1');
    expect(h1Element).toBeTruthy();
    expect(h1Element.textContent).toBe('Projects');
  });

  it('should render description text', () => {
    const pElement = fixture.nativeElement.querySelector('p');
    expect(pElement).toBeTruthy();
    expect(pElement.textContent).toBe('Manage and track all your ongoing projects here.');
  });

  it('should have correct welcome-section class', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section).toBeTruthy();
    expect(section.classList.contains('welcome-section')).toBeTruthy();
  });

  it('should apply correct styles to welcome section', () => {
    const section = fixture.nativeElement.querySelector('.welcome-section');
    const styles = window.getComputedStyle(section);

    expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(styles.borderRadius).toBe('8px');
    expect(styles.padding).toBe('16px 32px');
  });
});
