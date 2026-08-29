import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { HelperLoadingService } from 'helper/services/loading/loading.service';
import { Observable, finalize, take } from 'rxjs';

export const helperLoadingInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const helperLoadingService = inject(HelperLoadingService);
    let handleRequestsAutomatically = false;

    helperLoadingService.auto$.pipe(take(1)).subscribe((value) => {
        handleRequestsAutomatically = value;
    });

    // If the Auto mode is turned off, do nothing
    if (!handleRequestsAutomatically) {
        return next(req);
    }

    // Skip asset requests (SVG icons, fonts, etc.) from triggering the loading bar
    if (req.url.endsWith('.svg') || req.url.includes('/assets/')) {
        return next(req);
    }

    // Set the loading status to true
    helperLoadingService._setLoadingStatus(true, req.url);

    return next(req).pipe(
        finalize(() => {
            // Set the status to false if there are any errors or the request is completed
            helperLoadingService._setLoadingStatus(false, req.url);
        })
    );
};
