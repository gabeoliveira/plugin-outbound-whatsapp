import { CustomizationProvider } from '@twilio-paste/core/customization';

const EvoluServicesThemeProvider = (RootComponent) => (props) => {
  const pasteProviderProps = {
    baseTheme: props.theme?.isLight ? 'default' : 'dark',
    theme: props.theme?.tokens,
    style: { minWidth: '100%', height: '100%' },
    elements: {
      MAIN_HEADER_MENU_BUTTON: {
        'box-shadow': 'none !important',
      },
      MODAL_BODY: {
        'max-height': 'calc(100vh - 211px)',
      },
      COMBOBOX_MODAL_LISTBOX: {
        position: 'fixed',
        'max-height': '200px',
        'max-width': 'calc(100% - 32px)',
      },
    },
  };

  return (
    <CustomizationProvider {...pasteProviderProps}>
      <RootComponent {...props} />
    </CustomizationProvider>
  );
};

export default EvoluServicesThemeProvider;
