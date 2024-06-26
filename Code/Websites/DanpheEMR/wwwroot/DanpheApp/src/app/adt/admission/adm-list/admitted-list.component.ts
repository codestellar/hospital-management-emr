import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { CallbackService } from '../../../shared/callback.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { AdmissionModel } from "../../shared/admission.model";
import { ADT_BLService } from '../../shared/adt.bl.service';
import { BedFeature } from '../../shared/bedfeature.model';
//import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import * as _ from 'lodash';
import * as moment from 'moment/moment';
import { Patient } from '../../../patients/shared/patient.model';
import { SecurityService } from '../../../security/shared/security.service';
import { NepaliCalendarService } from "../../../shared/calendar/np/nepali-calendar.service";
import { NepaliDate } from "../../../shared/calendar/np/nepali-dates";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";

import { BillingBLService } from '../../../billing/shared/billing.bl.service';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonValidators } from '../../../shared/common-validator';
import { CommonFunctions } from '../../../shared/common.functions';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { ENUM_ValidatorTypes } from '../../../shared/shared-enums';
import { VisitGenericStickerModel } from '../../../shared/visit-generic-stickers/visit-generic-sticker.model';
import { AdmittingDocInfoVM } from '../../shared/admission.view.model';
import { ADTGridColumnSettings } from '../../shared/adt-grid-column-settings';
import { AdmissionSlipDetails_DTO } from '../../shared/DTOs/admission-slip-details.dto';



@Component({
  templateUrl: "./admitted-list.html"
})

export class AdmittedListComponent {
  public admittedList: Array<AdmissionModel> = new Array<AdmissionModel>();
  public admission: AdmissionModel = new AdmissionModel();
  admittedListGridColumns: Array<any> = null;
  public admittedpatientdrinfo: AdmittingDocInfoVM = null;
  public showChangeDoctorPage: boolean = false;
  public selectedBedInfo: { PatientAdmissionId, PatientId, PatientVisitId, MSIPAddressInfo, PatientCode, DischargedDate, Name, AdmittingDoctor, BedInformation: { BedId, PatientBedInfoId, Ward, BedFeature, BedCode, BedNumber, BedFeatureId, AdmittedDate, WardId, StartedOn } };
  public showTransferPage: boolean = false;
  public showUpgradePage: boolean = false;
  public selectedIndex: number;
  public selectedAdmission: any;
  public showDischargePopUpBox: boolean = false;
  public disableDischarge: boolean = false;
  public showPatientBillHistory: boolean = false;
  public selPatient: Patient = new Patient();
  public similarBedFeatures: Array<BedFeature>;
  public validDate: boolean = true;
  public dischargeDateNp: NepaliDate;
  public patientVisitId: number;
  public showSticker: boolean = false;
  public showCancelAdmissionPage: boolean = false;
  public selPatId: number = 0;
  public selVisitId: number = 0;
  public showCancelAdmissionPopUpBox: boolean = false;

  public showGenericSticker: boolean = false;//sud:28-Oct-2018
  public patVisitGenericStickerInfo: VisitGenericStickerModel = new VisitGenericStickerModel();//sud:28-oct-2018

  public showWristBand: boolean = false;//sud: 7thjan'19

  public showInvalidTransferPopUp: boolean = false;

  public adtGriColumns: ADTGridColumnSettings = null;//sud: 10Jan'19-- to use parameterized grid-columns, we created separate class for ADT-Grid-Columns.
  public selectedAdmittedPat: any;
  public showPoliceCase: boolean = false;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public showIsInsurancePatient: boolean = false;
  public allItemList = [];
  public filteredItemList = []
  public showAdmissionSlip: boolean = false;
  public admissionSlipDetails: AdmissionSlipDetails_DTO = new AdmissionSlipDetails_DTO();

  constructor(
    private router: Router,
    private admissionBLService: ADT_BLService,
    private billingBLService: BillingBLService,
    private changeDetector: ChangeDetectorRef,
    private securityService: SecurityService,
    private messageBoxService: MessageboxService,
    private callBackService: CallbackService,
    private npCalendarService: NepaliCalendarService,
    private coreService: CoreService) {
    //checking if counter is selected or not, as we need counterID while transfering patient
    if (this.securityService.getLoggedInCounter().CounterId < 1) {
      this.callBackService.CallbackRoute = '/ADTMain/AdmittedList';
    }
    else {
      this.adtGriColumns = new ADTGridColumnSettings(this.coreService, this.securityService);
      this.Load();
      this.admittedListGridColumns = this.adtGriColumns.AdmittedList;
      this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('AdmittedDate', true));
      this.LoadDepartments();
    }
  }

  ngAfterViewChecked() {
    this.changeDetector.detectChanges();
  }

  Load(): void {
    this.admissionBLService.GetAdmittedPatients()
      .subscribe(res => {
        if (res.Status == 'OK') {
          this.admittedList = res.Results;
          this.allItemList = res.Results;
        }
        else {
          this.messageBoxService.showMessage("error", [res.ErrorMessage]);
        }
      },
        err => {
          this.messageBoxService.showMessage("error", [err.ErrorMessage]);
        });
  }

  UpdateBedDurations(visitId: number) {
    this.billingBLService.UpdateBedDurationBillTxn(visitId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          //console.log("ADT Bill Items Quantity updated.");
        }
        else {
          console.log("Failed to update bed transaction detail.");
          console.log(res.ErrorMessage);
        }
      });
  }


  AdmittedListGridActions($event: GridEmitModel) {

    switch ($event.Action) {
      case "discharge": {
        this.selectedAdmission = null;
        this.changeDetector.detectChanges();
        this.selectedAdmission = $event.Data;
        this.selectedIndex = $event.RowIndex;
        this.mapAdmission();
        CommonValidators.ComposeValidators(this.admission.AdmissionValidator, "DischargeRemarks", [ENUM_ValidatorTypes.required, ENUM_ValidatorTypes.maxLength100]);
        //this.admission.UpdateDischargeValidator(true);
        this.CheckPatientCreditBill();
        break;

      }
      case "transfer": {
        var selectedBedInfo = Object.create($event.Data);
        //if (!this.selectedBedInfo.DischargedDate) {
        this.selectedIndex = $event.RowIndex;
        this.patientVisitId = $event.Data.PatientVisitId;
        this.showTransferPage = false;
        this.changeDetector.detectChanges();
        this.selectedBedInfo = selectedBedInfo;
        this.showTransferPage = true;
        //}
        //else {
        //    this.msgBoxServ.showMessage("failed", ["Patient is in the process of discharge."]);
        //}
        break;
      }
      case "changedr": {

        this.showChangeDoctorPage = false;
        this.changeDetector.detectChanges();
        this.showChangeDoctorPage = true;
        var admittedPatientDrInfo = Object.create($event.Data);
        this.admittedpatientdrinfo = admittedPatientDrInfo;
        break;
      }
      case "upgrade": {
        this.selectedBedInfo = Object.create($event.Data);
        if (!this.selectedBedInfo.DischargedDate) {
          this.selectedIndex = $event.RowIndex;
          this.GetSimilarBedFeatures();
        }
        else {
          this.messageBoxService.showMessage("failed", ["Patient is in the process of discharge."]);
        }
        break;
      }
      case "billdetail": {
        var data = $event.Data;
        this.showPatientBillHistory = false;
        this.changeDetector.detectChanges();
        this.selPatient = new Patient();
        this.selPatient = data;
        //this.selPatient.PatientId = data.PatientId;
        //this.selPatient.PatientCode = data.PatientCode;
        this.selPatient.ShortName = data.Name;
        this.showPatientBillHistory = true;
        break;
      }
      case "show-sticker": {
        this.patientVisitId = null;
        this.showSticker = false;
        this.changeDetector.detectChanges();
        this.patientVisitId = $event.Data.PatientVisitId;
        this.showSticker = true;
        break;
      }
      case "generic-sticker": {
        this.patientVisitId = null;
        this.patVisitGenericStickerInfo = this.MapVisitGenericSticker($event.Data);
        this.showGenericSticker = false;
        this.changeDetector.detectChanges();
        //this.patientVisitId = $event.Data.PatientVisitId;
        this.showGenericSticker = true;
        break;
      }
      case "cancel": {
        //var selectedPatient = Object.create($event.Data);
        //this.selectedIndex = $event.RowIndex;
        this.selPatId = $event.Data.PatientId;
        this.selVisitId = $event.Data.PatientVisitId;
        this.showCancelAdmissionPage = false;
        this.changeDetector.detectChanges();
        this.showCancelAdmissionPage = true;

        //this.mapAdmission();
        break;
      }
      case "ip-wrist-band": {
        this.patientVisitId = $event.Data.PatientVisitId;
        this.showWristBand = false;
        this.changeDetector.detectChanges();
        this.showWristBand = true;
        break;
      }
      case "transfer-hold": {
        // this.patientVisitId = $event.Data.PatientVisitId;
        this.selectedAdmittedPat = $event.Data;
        this.showInvalidTransferPopUp = false;
        this.changeDetector.detectChanges();
        this.showInvalidTransferPopUp = true;
        break;
      }
      case "admission-slip": {
        this.patientVisitId = $event.Data.PatientVisitId;
        this.showInvalidTransferPopUp = false;
        this.showSticker = false;
        this.showAdmissionSlip = true;
        this.changeDetector.detectChanges();
        break;
      }
      default:
        break;
    }
  }

  public CloseTransferInvalidPopUp() {
    this.selectedAdmittedPat = null;
    this.showInvalidTransferPopUp = false;
  }

  public GetSimilarBedFeatures() {
    this.admissionBLService.GetSimilarBedFeatures(this.selectedBedInfo.BedInformation.WardId, this.selectedBedInfo.BedInformation.BedFeatureId)
      .subscribe(res => {
        if (res.Status == 'OK') {
          if (res.Results.length) {
            this.similarBedFeatures = res.Results;
            this.showUpgradePage = false;
            this.changeDetector.detectChanges();
            this.showUpgradePage = true;
          }
          else {
            this.messageBoxService.showMessage("failed", ["Change Bed Feature is not available for this bed. Please use transfer instead."]);
          }
        }
      });
  }
  TransferUpgrade($event) {
    let visitId = this.patientVisitId;
    this.Load();
    this.UpdateBedDurations(visitId);
    this.patientVisitId = null;
    this.showTransferPage = false;
    this.showUpgradePage = false;
    this.showChangeDoctorPage = false;
  }

  CancelAdmission($event) {
    this.showCancelAdmissionPage = false;
    this.selPatId = this.selVisitId = 0;
    this.Load();
  }

  //discharge
  mapAdmission() {
    this.admission = new AdmissionModel();
    _.assign(this.admission, _.pick(this.selectedAdmission, _.keys(this.admission)));
    this.admission.AdmissionDate = moment(this.selectedAdmission.AdmittedOn).format('YYYY-MM-DDTHH:mm:ss');
    this.admission.DischargeDate = moment().format('YYYY-MM-DDTHH:mm:ss');
    this.admission.DischargedBy = this.securityService.GetLoggedInUser().EmployeeId;
    this.admission.ModifiedBy = this.securityService.GetLoggedInUser().EmployeeId;
    this.validDate = true;
  }

  CheckPatientCreditBill() {
    this.admissionBLService.CheckPatientCreditBillStatus(this.selectedAdmission.PatientId)
      .subscribe(res => {
        if (res.Status == 'OK') {
          if (res.Results) {
            this.disableDischarge = true;
            this.admission.BillStatusOnDischarge = "unpaid";
          }
          else {
            this.admission.BillStatusOnDischarge = "paid";
          }
          this.showDischargePopUpBox = true;
        }
        else {
          this.messageBoxService.showMessage("error", [res.ErrorMessage]);
        }
      },
        err => {
          this.messageBoxService.showMessage("error", ['Failed to get credit details.. please check log for details.']);
          this.logError(err.ErrorMessage);
        });
  }

  Discharge() {
    //Everytime empty value was sent to the validator.
    this.compareDate();
    this.admission.AdmissionValidator.controls['AdmissionDate'].disable();
    this.admission.AdmissionValidator.controls['AdmittingDoctorId'].disable();
    for (var i in this.admission.AdmissionValidator.controls) {
      this.admission.AdmissionValidator.controls[i].markAsDirty();
      this.admission.AdmissionValidator.controls[i].updateValueAndValidity();
    }
    if (this.admission.IsValidCheck(undefined, undefined) && this.validDate) {
      this.admissionBLService.DischargePatient(this.admission, this.selectedAdmission.BedInformation.PatientBedInfoId)
        .subscribe(res => {
          if (res.Status == 'OK') {
            this.selectedAdmission.DischargedDate = res.Results;
            this.messageBoxService.showMessage("success", ["Patient Discharged"]);
            this.Load();
            this.showDischargePopUpBox = false;
            this.disableDischarge = false;
          }
          else {
            this.messageBoxService.showMessage("failed", ["Failed to discharge patient. Check log for error detail."]);
            this.logError(res.ErrorMessage);
          }
        });
    }
  }
  public compareDate() {
    if ((moment(this.admission.DischargeDate).diff(this.selectedAdmission.BedInformation.StartedOn) < 0)
      || (moment(this.admission.DischargeDate).diff(moment().add(10, 'minutes').format('YYYY-MM-DD HH:mm')) > 0)
      || !this.admission.DischargeDate)
      this.validDate = false;
    else
      this.validDate = true;
  }

  logError(err: any) {
    console.log(err);
  }

  //convert nepali date to english date and assign to english calendar
  NepCalendarOnDateChange() {
    let engDate = this.npCalendarService.ConvertNepToEngDate(this.dischargeDateNp);
    this.admission.DischargeDate = engDate;
  }
  //this method fire when english calendar date changed
  //convert english date to nepali date and assign to nepali canlendar
  EngCalendarOnDateChange() {
    if (this.admission.DischargeDate) {
      let nepDate = this.npCalendarService.ConvertEngToNepDate(this.admission.DischargeDate);
      this.dischargeDateNp = nepDate;
    }
  }

  StickerPrintCallBack($event) {
    this.showSticker = false;
    this.showAdmissionSlip = false;
    this.patientVisitId = null;
  }

  CloseBillHistory() {
    this.showPatientBillHistory = false;
  }
  //sud:28-Oct-2018
  CloseGenericSticker() {
    this.showGenericSticker = false;
  }

  //sud:6Jan2019
  CloseWristBandPage() {
    this.showWristBand = false;
  }

  MapVisitGenericSticker(admInfo): VisitGenericStickerModel {
    let retData = new VisitGenericStickerModel();
    retData.HospitalNo = admInfo.PatientCode;
    retData.PatientFullName = admInfo.Name;
    retData.BarCodeNum = admInfo.PatientCode;
    retData.VisitType = "inpatient";

    let latestBedInfo = null;
    if (admInfo.BedInformation) {
      latestBedInfo = admInfo.BedInformation.Ward + "/" + admInfo.BedInformation.BedCode;
    }
    retData.Ward_Bed = latestBedInfo;

    let dob = admInfo.DateOfBirth;
    let gender: string = admInfo.Gender;
    retData.AgeSex = CommonFunctions.GetFormattedAgeSex(dob, gender);
    retData.DoctorName = admInfo.AdmittingDoctorName;

    return retData;
  }
  public FilterGridItems(event) {
    this.filteredItemList = [];
    if (this.showPoliceCase && this.showIsInsurancePatient) {
      this.filteredItemList = this.allItemList.filter(s => s.IsInsurancePatient == true || s.IsPoliceCase == true);
    }
    else if (this.showIsInsurancePatient && !this.showPoliceCase) {
      this.filteredItemList = this.allItemList.filter(s => s.IsInsurancePatient == true);
    }
    else if (!this.showIsInsurancePatient && this.showPoliceCase) {
      this.filteredItemList = this.allItemList.filter(s => s.IsPoliceCase == true);
    }
    else {
      this.filteredItemList = this.allItemList;
    }
    this.admittedList = this.filteredItemList;
  }


  GetHistoryEitter($event) {
    if ($event && $event.close) {
      this.CloseBillHistory();
    }
  }

  public allDepartments: Array<any> = [];
  public LoadDepartments() {
    this.admissionBLService.GetDepartments()
      .subscribe((res: DanpheHTTPResponse) => {
        this.allDepartments = res.Results;

      });
  }

  public CloseAdmissionSlip(): void {
    this.showAdmissionSlip = false;
  }

  Close() { }
}
