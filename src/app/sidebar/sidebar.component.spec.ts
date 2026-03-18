import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: Router, useValue: spy }
      ]
    })
      .compileComponents();

    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize menuItems with 3 items', () => {
      component.ngOnInit();
      expect(component.menuItems).toBeDefined();
      expect(component.menuItems.length).toBe(3);
    });

    it('should configure Model Level DPP Search menu item', () => {
      component.ngOnInit();
      const searchItem = component.menuItems[0];

      expect(searchItem.label).toBe('Model Level DPP Search');
      expect(searchItem.icon).toBe('pi pi-search');
      expect(searchItem.command).toBeDefined();
    });

    it('should configure DPP Viewer menu item', () => {
      component.ngOnInit();
      const viewerItem = component.menuItems[1];

      expect(viewerItem.label).toBe('DPP Viewer');
      expect(viewerItem.icon).toBe('pi pi-eye');
      expect(viewerItem.command).toBeDefined();
    });

    it('should configure DPPs Comparison menu item', () => {
      component.ngOnInit();
      const comparisonItem = component.menuItems[2];

      expect(comparisonItem.label).toBe('DPPs Comparison');
      expect(comparisonItem.icon).toBe('pi pi-chart-bar');
      expect(comparisonItem.command).toBeDefined();
    });
  });

  describe('menu navigation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should navigate to search when search menu item is clicked', () => {
      const searchItem = component.menuItems[0];
      searchItem.command!({});

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
    });

    it('should navigate to view when viewer menu item is clicked', () => {
      const viewerItem = component.menuItems[1];
      viewerItem.command!({});

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/view']);
    });

    it('should navigate to comparison when comparison menu item is clicked', () => {
      const comparisonItem = component.menuItems[2];
      comparisonItem.command!({});

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/comparison']);
    });
  });

  describe('template rendering', () => {
    it('should render PanelMenu component', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-panelmenu')).toBeTruthy();
    });
  });
});
