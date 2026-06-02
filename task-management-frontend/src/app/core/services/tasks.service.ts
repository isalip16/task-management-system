import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, Task, TaskStatus, TaskFilters, CreateTaskPayload, UpdateTaskPayload } from '@core/models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getAll(filters?: TaskFilters): Observable<ApiResponse<any>> {
    const params = this.buildHttpParams(filters);
    return this.http.get<ApiResponse<any>>(this.apiUrl, { params });
  }

  getByProject(projectId: string, filters?: TaskFilters): Observable<ApiResponse<any>> {
    const params = this.buildHttpParams(filters);
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/project/${projectId}`,
      { params }
    );
  }

  private buildHttpParams(filters?: TaskFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) return params;

    if (filters.status)     params = params.set('status', filters.status);
    if (filters.priority)   params = params.set('priority', filters.priority);
    if (filters.assignedTo) params = params.set('assignedTo', filters.assignedTo);
    if (filters.search)     params = params.set('search', filters.search);
    if (filters.page)       params = params.set('page', filters.page.toString());
    if (filters.limit)      params = params.set('limit', filters.limit.toString());

    return params;
  }

  getOne(id: string): Observable<ApiResponse<Task>> {
    return this.http.get<ApiResponse<Task>>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateTaskPayload): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, payload);
  }

  update(id: string, payload: UpdateTaskPayload): Observable<ApiResponse<Task>> {
    return this.http.patch<ApiResponse<Task>>(`${this.apiUrl}/${id}`, payload);
  }

  updateStatus(id: string, status: TaskStatus): Observable<ApiResponse<Task>> {
    return this.http.patch<ApiResponse<Task>>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  getActivityLogs(
    projectId: string,
    page = 1,
    limit = 20
  ): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/project/${projectId}/logs`,
      { params }
    );
  }
}
