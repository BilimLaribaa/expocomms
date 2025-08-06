import { CONFIG } from 'src/config-global';
import { ContactView } from 'src/pagesview/contact-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Contacts - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Manage your contacts with a modern, intuitive interface built with Material-UI"
      />
      <meta name="keywords" content="contacts,management,crm,dashboard,material-ui" />

      <ContactView />
    </>
  );
}
