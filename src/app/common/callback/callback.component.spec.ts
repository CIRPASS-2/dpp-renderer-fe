import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CallbackComponent],
      providers: [
        { provide: Router, useValue: spy }
      ]
    })
      .compileComponents();

    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should navigate to search page', async () => {
      await component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
    });

    it('should navigate immediately when component initializes', async () => {
      const navigateSpy = routerSpy.navigate;
      navigateSpy.and.returnValue(Promise.resolve(true));

      await component.ngOnInit();

      expect(navigateSpy).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledWith(['/search']);
    });
  });

  describe('template rendering', () => {
    it('should render component template', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();
    });
  });
});
