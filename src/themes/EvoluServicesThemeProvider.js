import { CustomizationProvider } from '@twilio-paste/core/customization';

const EvoluServicesThemeProvider = (RootComponent) => (props) => {
  const pasteProviderProps = {
    baseTheme: props.theme?.isLight ? 'default' : 'dark',
    theme: props.theme?.tokens,
    style: { minWidth: '100%', height: '100%' },
    elements: {
      MODAL_HEADER: {
        'box-shadow': 'none !important',
        'border-bottom': '1px solid rgb(57, 71, 98)',
        padding: '1rem',
      },
      MODAL_BODY: {
        'max-height': 'calc(100vh - 199px)',
        padding: '1rem 1rem 1.25rem',
        'border-bottom': '1px solid rgb(57, 71, 98)',
      },
      MODAL_FOOTER: {
        padding: '1rem',
      },
      COMBOBOX_MODAL_LISTBOX: {
        'max-height': '200px',
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
