import { Component, OnInit } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/angular';
import { map } from 'rxjs/operators';
import {
  ConfirmListResponse,
  ConfirmResponse,
} from 'src/app/model/dashboard.model';

import { AuthService } from 'src/app/service/auth.service';
import { DashboardService } from 'src/app/service/dashboard.service';
import { OTServiceService } from 'src/app/service/otservice.service';
import { TimeOffService } from 'src/app/service/time-off.service';
import { ToastsService } from 'src/app/service/toasts.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  single: any[];
  multi = [];
  xAxisLabel = 'Tháng';
  yAxisLabel = 'Lương nhân viên ';
  timeline = true;
  // options
  view = [300, 350];
  viewSalary = [750, 550];
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'],
  };
  events: { date: string; display: string; backgroundColor: string }[] = [];
  dataUserByDepartment = [];
  isAdmin: boolean;
  confirmList: ConfirmResponse[] = [];
  loadListConfirm = false;
  loadConfirm = false;
  loadAccept = false;
  totalUsers: number;
  totalUserWorker: number;
  totalUsersOT: number;
  departments: number;
  acceptOTList = [];
  isLeader: boolean;
  dateOff = new Date();
  listUserOff = [];
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    headerToolbar: false,
    weekends: true,
  };
  totalDayWorker: number;
  totalDayOff: number;
  totalSalary: number;
  totalDayLeaveHaveGross: number;
  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private toastService: ToastsService,
    private otService: OTServiceService,
    private timeOffService: TimeOffService
  ) {}
  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    if (this.isAdmin) {
      this.loadListConfirm = true;
      this.dashboardService
        .showListConfirm()
        .subscribe((data: ConfirmListResponse) => {
          this.confirmList = data.data;
          this.loadListConfirm = false;
        });
      this.dashboardService.getSalaryByMonth().subscribe((data) => {
        const luong = data.data.map((month) => {
          const tungThang = month.series.map((serie) => {
            return { name: serie.date, value: serie.luong };
          });
          return { name: month.name, series: tungThang };
        });
        this.multi = luong;
      });
      this.dashboardService.getOTYesterday().subscribe((data) => {
        this.totalUsersOT = data.data.tongtangca;
      });
      this.dashboardService.getTotalUserByDepartment().subscribe((data) => {
        const department = data.data;
        const userByDepartment = department.map((departmentInfo) => {
          return {
            name: departmentInfo.phongban_userinfo.name,
            value: departmentInfo.total_user,
          };
        });
        this.dataUserByDepartment = userByDepartment;
      });
      this.dashboardService.getTotalUser().subscribe((data) => {
        this.totalUsers = data.data[0].so_luong_user;
      });
      this.dashboardService.getTotalUserWorker().subscribe((data) => {
        this.totalUserWorker = data.data[0].nhan_vien_di_lam;
      });
      this.dashboardService.getAllDepartment().subscribe((data) => {
        this.departments = data.data[0].so_luong_phong_ban;
      });
    } else {
      this.dashboardService.getTotalSalaryByUser().subscribe((data) => {
        this.totalSalary = data.data[0].total_net_salary;
      });
      this.dashboardService.getTotalWorkByUser().subscribe((data) => {
        this.totalDayWorker = data.data[0].tong_ngay_di_lam;
      });
      this.dashboardService.getTotalLeaveHaveGrossbyUser().subscribe((data) => {
        this.totalDayLeaveHaveGross = data.data[0].tongsongaynghi;
      });
      this.dashboardService.getTotalDayOffByUser().subscribe((data) => {
        this.totalDayOff = data.data[0].nhan_vien_nghi_lam;
      });
    }
    this.dashboardService.showCalendar().subscribe((data) => {
      data.data.ngay.forEach((ngay) => {
        this.events.push({
          date: ngay,
          display: 'background',
          backgroundColor: '',
        });
      });
      data.data.total_di_lam.forEach((dilam, index) => {
        if (dilam === '0') {
          this.events[index].backgroundColor = 'red';
        } else if (dilam === '1') {
          this.events[index].backgroundColor = 'green';
        } else {
          this.events[index].backgroundColor = 'transparent';
        }
      });

      this.calendarOptions = {
        initialView: 'dayGridMonth',
        headerToolbar: false,
        weekends: true,
        events: this.events,
      };
    });
    this.getListOTByUser();
  }
  getListOTByUser(): void {
    this.otService.getListOTByUser().subscribe((data) => {
      this.acceptOTList = data.data;
    });
  }
  handleAprove(id: string, index): void {
    this.loadConfirm = true;
    this.dashboardService.acceptLeave(id).subscribe(
      (data) => {
        this.loadConfirm = false;
        this.toastService.show(data.message, {
          classname: 'bg-success text-light',
          delay: 3000,
        });
        this.confirmList.splice(index, 1);
      },
      (err) => {
        this.loadConfirm = false;
        this.toastService.show(err.error.message, {
          classname: 'bg-danger text-light',
          delay: 3000,
        });
      }
    );
  }
  handleReject(id: string, index): void {
    this.loadConfirm = true;
    this.dashboardService.rejectLeave(id).subscribe((data) => {
      this.loadConfirm = false;
      this.toastService.show(data.message, {
        classname: 'bg-success text-light',
        delay: 3000,
      });
      this.confirmList.splice(index, 1);
    });
  }
  handleAccept(id: string): void {
    this.loadAccept = true;
    this.otService.confirmOT(id).subscribe(
      (data) => {
        this.loadAccept = false;
        this.toastService.show(data.message, {
          classname: 'bg-success text-light',
          delay: 3000,
        });
        this.getListOTByUser();
      },
      (err: any) => {
        this.toastService.show(err.error.message, {
          classname: 'bg-danger text-light',
          delay: 3000,
        });
      }
    );
  }
  handleNotAccept(id: string): void {
    this.loadAccept = true;
    this.otService.notConfirmOT(id).subscribe(
      (data) => {
        this.toastService.show(data.message, {
          classname: 'bg-success text-light',
          delay: 3000,
        });
        this.getListOTByUser();
      },
      (err: any) => {
        this.toastService.show(err.error.message, {
          classname: 'bg-danger text-light',
          delay: 3000,
        });
      }
    );
  }

  getAllUserOff() {
    this.timeOffService.getAllTimeOff().subscribe((data) => {
      for (let i = 0; i < data.data.length; i++) {
        if (data.data[i].status === 1 && data.data[i].date === this.dateOff) {
          this.listUserOff.push(data.data[i]);
        }
      }
    });
  }
}
