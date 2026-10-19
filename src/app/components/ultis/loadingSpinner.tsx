import "../../styles/ultis/loadingSpinner.scss";

export const LoadingSpinner = () => (
  <div className="pageLoading" role="status">
    <span className="pageLoading__ring" aria-hidden />
    <span>Putting the kettle on…</span>
  </div>
);
