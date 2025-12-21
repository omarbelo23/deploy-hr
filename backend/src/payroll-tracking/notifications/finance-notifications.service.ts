import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type FinanceNotification = {
  type: 'claim' | 'dispute';
  id: string;
  businessId?: string;
  status: string;
  createdAt: Date;
};

@Injectable()
export class FinanceNotificationsService {
  private subject = new Subject<FinanceNotification>();
  private recent: FinanceNotification[] = [];

  emit(notification: FinanceNotification) {
    this.recent.unshift(notification);
    if (this.recent.length > 100) {
      this.recent.pop();
    }
    this.subject.next(notification);
  }

  stream() {
    return this.subject.asObservable();
  }

  getRecent(): FinanceNotification[] {
    return [...this.recent];
  }
}
