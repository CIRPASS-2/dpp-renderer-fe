import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DppFetchService, DppJsonLdResult, DppJsonResult } from '../../common/dpp-fetch.service';
import { ScannerComponent } from '../../common/scanner/scanner.component';
import { DppRendererComponent } from '../json-ld/dpp-renderer/dpp-renderer.component';
import { PlainJsonRendererComponent } from '../json/plain-json-rendering/plain-json-renderer.component';
import { ExpandedJsonLd, JsonObject } from '../rendering-models';
import { DppViewerComponent } from './dpp-viewer.component';

// Mock child components
@Component({
  selector: 'app-plain-json-renderer',
  template: ''
})
class MockPlainJsonRendererComponent { }

@Component({
  selector: 'app-dpp-renderer',
  template: ''
})
class MockDppRendererComponent { }

@Component({
  selector: 'app-scanner',
  template: ''
})
class MockScannerComponent { }

describe('DppViewerComponent', () => {
  let component: DppViewerComponent;
  let fixture: ComponentFixture<DppViewerComponent>;
  let dppFetchServiceSpy: jasmine.SpyObj<DppFetchService>;
  let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

  const mockJsonResult: DppJsonResult = {
    kind: 'json',
    data: { test: 'data' } as JsonObject,
    contentType: 'application/json'
  };

  const mockJsonLdResult: DppJsonLdResult = {
    kind: 'jsonld',
    data: [{ '@id': 'test' }] as ExpandedJsonLd,
    contentType: 'application/ld+json'
  };

  beforeEach(async () => {
    const fetchSpy = jasmine.createSpyObj('DppFetchService', ['fetch']);
    const routeSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      queryParams: of({ url: 'https://example.com/dpp' })
    });

    await TestBed.configureTestingModule({
      imports: [DppViewerComponent],
      providers: [
        { provide: DppFetchService, useValue: fetchSpy },
        { provide: ActivatedRoute, useValue: routeSpy },
        provideNoopAnimations()
      ]
    })
      .overrideComponent(DppViewerComponent, {
        remove: {
          imports: [
            PlainJsonRendererComponent,
            DppRendererComponent,
            ScannerComponent
          ]
        },
        add: {
          imports: [MockPlainJsonRendererComponent, MockDppRendererComponent, MockScannerComponent]
        }
      })
      .compileComponents();

    dppFetchServiceSpy = TestBed.inject(DppFetchService) as jasmine.SpyObj<DppFetchService>;
    activatedRouteSpy = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    fixture = TestBed.createComponent(DppViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize with URL from query params and fetch data', () => {
      dppFetchServiceSpy.fetch.and.returnValue(of(mockJsonResult));

      component.ngOnInit();

      expect(component.url).toBe('https://example.com/dpp');
      expect(dppFetchServiceSpy.fetch).toHaveBeenCalledWith('https://example.com/dpp');
      expect(component.fetchResult).toBe(mockJsonResult);
    });

    it('should not fetch if no URL in query params', () => {
      Object.defineProperty(activatedRouteSpy, 'queryParams', {
        get: () => of({})
      });

      component.ngOnInit();

      expect(component.url).toBeUndefined();
      expect(dppFetchServiceSpy.fetch).not.toHaveBeenCalled();
    });

    it('should handle URL changes from query params', () => {
      dppFetchServiceSpy.fetch.and.returnValue(of(mockJsonResult));
      Object.defineProperty(activatedRouteSpy, 'queryParams', {
        get: () => of(
          { url: 'https://example.com/dpp1' },
          { url: 'https://example.com/dpp2' }
        )
      });

      component.ngOnInit();

      expect(dppFetchServiceSpy.fetch).toHaveBeenCalled();
    });
  });

  describe('fetch method', () => {
    it('should fetch data when URL is provided', () => {
      component.url = 'https://example.com/dpp';
      dppFetchServiceSpy.fetch.and.returnValue(of(mockJsonResult));

      component.fetch();

      expect(dppFetchServiceSpy.fetch).toHaveBeenCalledWith('https://example.com/dpp');
      expect(component.fetchResult).toBe(mockJsonResult);
    });

    it('should not fetch when URL is not provided', () => {
      component.url = undefined;

      component.fetch();

      expect(dppFetchServiceSpy.fetch).not.toHaveBeenCalled();
    });
  });

  describe('hasUrl method', () => {
    it('should return true when URL is defined', () => {
      component.url = 'https://example.com/dpp';
      expect(component.hasUrl()).toBe(true);
    });

    it('should return false when URL is undefined', () => {
      component.url = undefined;
      expect(component.hasUrl()).toBe(false);
    });

    it('should return false when URL is null', () => {
      component.url = null as any;
      expect(component.hasUrl()).toBe(false);
    });
  });

  describe('scanner methods', () => {
    it('should open scanner', () => {
      component.openScanner();
      expect(component.showScanner).toBe(true);
    });

    it('should handle scan completion with URL', () => {
      const testUrl = 'https://scanned.com/dpp';
      component.onScanCompleted(testUrl);

      expect(component.url).toBe(testUrl);
      expect(component.showScanner).toBe(false);
    });

    it('should handle scan completion without URL', () => {
      const originalUrl = 'https://original.com';
      component.url = originalUrl;

      component.onScanCompleted(null);

      expect(component.url).toBe(originalUrl);
      expect(component.showScanner).toBe(false);
    });

    it('should close scanner on done', () => {
      component.showScanner = true;
      component.onDoneScanner();
      expect(component.showScanner).toBe(false);
    });
  });

  describe('getter methods', () => {
    it('should return JSON data for asJson getter', () => {
      component.fetchResult = mockJsonResult;
      expect(component.asJson).toBe(mockJsonResult.data);
    });

    it('should return JSON-LD data for asJsonLd getter', () => {
      component.fetchResult = mockJsonLdResult;
      expect(component.asJsonLd).toBe(mockJsonLdResult.data);
    });
  });

  describe('template rendering', () => {
    it('should render input field', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('input[type="text"]')).toBeTruthy();
    });

    it('should render fetch button', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('button')).toBeTruthy();
    });
  });
});
