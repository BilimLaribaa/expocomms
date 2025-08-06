import { CONFIG } from 'src/config-global';
import EmailViewPage from 'src/pagesview/email-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Emails - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Manage your Email with a modern, intuitive interface built with Material-UI"
      />
      <meta name="keywords" content="Email,management,crm,dashboard,material-ui" />

      <EmailViewPage />
    </>
  );
}
