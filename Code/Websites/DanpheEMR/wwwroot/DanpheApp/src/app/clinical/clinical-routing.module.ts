import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';


import { ClinicalComponent } from '../clinical/clinical.component';
import { HomeMedicationListComponent } from '../clinical/medications/home-medication-list.component';
import { AllergyListComponent } from '../clinical/others/allergy-list.component';
import { InputOutputListComponent } from '../clinical/others/input-output-list.component';
import { VitalsListComponent } from '../clinical/vitals/vitals-list.component';
//import { NotesComponent } from '../clinical/notes/notes.component';
import { PageNotFound } from '../404-error/404-not-found.component';
import { DoctorsNotesComponent } from '../doctors/notes/doctors-notes.component';
import { BloodSugarMonitoringComponent } from './blood-sugar-monitoring/blood-sugar-monitoring.component';
import { EyeExaminationComponent } from './eye-examination/eye-form/eye-examination.component';
import { EyeHistoryComponent } from './eye-examination/eye-history/eye-history.component';
import { EyeMainComponent } from './eye-examination/eye-main/eye-main.component';
import { PrescriptionSlipHistoryComponent } from './eye-examination/prescription-slip-history/presription-slip-history.component';
import { PrescriptionSlipComponent } from './eye-examination/prescription-slip/prescription-slip.component';
import { ScanUploadComponent } from './eye-examination/scan-upload/scan-upload.component';
// import { FreeNotesComponent } from './notes/freenotes/freenotes.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',//this is: '/Clinical'
                component: ClinicalComponent,
                children: [
                    { path: '', redirectTo: 'Vitals', pathMatch: 'full' },
                    { path: 'Vitals', component: VitalsListComponent },
                    { path: 'Allergy', component: AllergyListComponent },
                    { path: 'HomeMedication', component: HomeMedicationListComponent },
                    { path: 'InputOutput', component: InputOutputListComponent },
                    { path: 'DoctorsNotes', component: DoctorsNotesComponent },

                    // {
                    //     path: 'Notes', component: ViewTemplateComponent,
                    //     children: [
                    //         { path: 'FreeNotes', component: FreeNotesComponent },
                    //         { path: 'ViewNotes', component: ViewTemplateComponent }
                    //     ]
                    // },

                    {
                        path: 'EyeExamination', component: EyeMainComponent,
                        children: [
                            { path: '', redirectTo: 'Prescriptionslip', pathMatch: 'full' },
                            { path: 'NewEMR', component: EyeExaminationComponent },
                            { path: 'EMRHistory', component: EyeHistoryComponent },
                            { path: 'Prescriptionslip', component: PrescriptionSlipComponent },
                            { path: 'ScanUpload', component: ScanUploadComponent },
                            { path: 'PrescriptionslipHistory', component: PrescriptionSlipHistoryComponent },
                            { path: "**", component: PageNotFound }
                        ]

                    },
                    { path: 'BloodSugarMonitoring', component: BloodSugarMonitoringComponent },
                    { path: "**", component: PageNotFound },
                ]
            }
        ])
    ],
    exports: [

        RouterModule
    ]
})
export class ClinicalRoutingModule { }
