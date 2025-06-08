import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DatamuseService {
  private baseUrl = 'https://api.datamuse.com/';

  constructor(private http: HttpClient) {}

  getRelatedConcepts(word: string): Observable<any> {
    const url = `${this.baseUrl}words?rel_trg=${word}`;
    return this.http.get(url);
  }
}
