import { Navigate, Route, Routes } from 'react-router-dom';
import { AccessPage } from './AccessPage';
import { ChildPinPage } from './ChildPinPage';
import { ExercisePage } from './ExercisePage';
import { RequireChild, RequireFamily, RequireParent } from './guards';
import { HomePage } from './HomePage';
import { ParentConfigPage } from './ParentConfigPage';
import { ParentHistoryPage } from './ParentHistoryPage';
import { ParentPinPage } from './ParentPinPage';
import { ParentStatsPage } from './ParentStatsPage';
import { ResultPage } from './ResultPage';
import { SetupPage } from './SetupPage';

/** Every screen of the app and the guards in front of them. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/" element={<RequireFamily><AccessPage /></RequireFamily>} />
      <Route path="/child/:id/pin" element={<RequireFamily><ChildPinPage /></RequireFamily>} />
      <Route path="/parent/pin" element={<RequireFamily><ParentPinPage /></RequireFamily>} />
      <Route
        path="/home"
        element={<RequireFamily><RequireChild>{(child) => <HomePage child={child} />}</RequireChild></RequireFamily>}
      />
      <Route
        path="/training"
        element={<RequireFamily><RequireChild>{(child) => <ExercisePage key="training" kind="training" child={child} />}</RequireChild></RequireFamily>}
      />
      <Route
        path="/blanks"
        element={<RequireFamily><RequireChild>{(child) => <ExercisePage key="blanks" kind="blanks" child={child} />}</RequireChild></RequireFamily>}
      />
      <Route
        path="/tables"
        element={<RequireFamily><RequireChild>{(child) => <ExercisePage key="tables" kind="tables" child={child} />}</RequireChild></RequireFamily>}
      />
      <Route
        path="/evaluation"
        element={<RequireFamily><RequireChild>{(child) => <ExercisePage key="evaluation" kind="evaluation" child={child} />}</RequireChild></RequireFamily>}
      />
      <Route
        path="/result/:id"
        element={<RequireFamily><RequireChild>{(child) => <ResultPage child={child} />}</RequireChild></RequireFamily>}
      />
      <Route path="/parent" element={<RequireFamily><RequireParent><ParentStatsPage /></RequireParent></RequireFamily>} />
      <Route path="/parent/history/:childId" element={<RequireFamily><RequireParent><ParentHistoryPage /></RequireParent></RequireFamily>} />
      <Route path="/parent/config" element={<RequireFamily><RequireParent><ParentConfigPage /></RequireParent></RequireFamily>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
