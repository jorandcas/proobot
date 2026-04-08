export const SEL = {
    // Login
    user: "id=es.indra.pc.mobile.activity.temm:id/user",
    password: "id=es.indra.pc.mobile.activity.temm:id/password",
    btnOk: "id=es.indra.pc.mobile.activity.temm:id/btnOk",

    // Dominio / ambiente
    spinnerDominio: "id=es.indra.pc.mobile.activity.temm:id/spinner_dominio",
    optionLocalByText: 'android=new UiSelector().text("Local")',

    // Post-login - Menú principal
    // Elemento "Porta SIN DN Transitorio" en el menú
    menuPortaSinDnTransito: 'android=new UiSelector().text("Porta SIN DN Transitorio")',
    // Alternativa usando resource-id si el texto falla
    menuPortaSinDnTransitoById: "id=es.indra.pc.mobile.activity.temm:id/label",

    // Formulario de búsqueda - Port sin DN Tránsito
    // Campos del formulario
    dnInput: "id=es.indra.pc.mobile.activity.temm:id/msisdnText",
    rfcInput: "id=es.indra.pc.mobile.activity.temm:id/rfcText",
    requestIdInput: "id=es.indra.pc.mobile.activity.temm:id/requestIdSearchText",

    // Botón continuar
    btnContinuar: "id=es.indra.pc.mobile.activity.temm:id/btnNext",

    // Modal de resultado - Interconexión
    dialogMessage: "id=es.indra.pc.mobile.activity.temm:id/dialog_message",
    // Botón aceptar - múltiples opciones
    btnAceptar: "id=android:id/button1",
    btnAceptarByText: 'android=new UiSelector().text("Aceptar")',
    btnAceptarByOK: 'android=new UiSelector().text("OK")',

    // Modal ml-prepago rollover portabilidad (aparece después de ingresar NIP)
    // Buscamos por el título o texto característico del modal
    modalRollover: 'android=new UiSelector().textContains("ml-prepago")',
    modalRolloverByTitle: 'android=new UiSelector().textContains("rollover")',
    // Botón para cerrar modal de rollover (puede variar: Aceptar, OK, Cerrar, etc)
    btnCerrarModalRollover: "id=android:id/button2", // Botón secundario o negativo
    btnCerrarModalRolloverText: 'android=new UiSelector().text("Aceptar")',

    // Modal "Está a punto de salir" (aparece al presionar SIGUIENTE en sección Línea)
    modalSalir: 'android=new UiSelector().textContains("a punto de salir")',
    modalSalirByVentana: 'android=new UiSelector().textContains("ventana")',
    // Botón CANCELAR del modal (para continuar con la venta actual, NO salir)
    btnCancelarModalSalir: 'android=new UiSelector().text("Cancelar")',

    // Sección 2: Datos personales - Indicador de tab/sección
    tabDatosPersonales: 'android=new UiSelector().text("2.- Datos personales")',
    tabDatosPersonalesById: "id=es.indra.pc.mobile.activity.temm:id/tab_text",
    // XPath para hacer click en el tab completo (LinearLayout + icon + text)
    tabDatosPersonalesLayout: '//android.widget.TextView[@text="2.- Datos personales"]/..',

    // Bloqueo ICC
    iccInput: "id=es.indra.pc.mobile.activity.temm:id/iccText",
    btnBloquearICC: "id=es.indra.pc.mobile.activity.temm:id/btnReserve",

    // Continuar trámite
    btnContinuarTramite: "id=es.indra.pc.mobile.activity.temm:id/btnOnNext",

    // Sección Línea - NIP y FVC
    nipInput: "id=es.indra.pc.mobile.activity.temm:id/pinText",

    // Spinner de Plan Comercial
    commercialPlanSpinner: "id=es.indra.pc.mobile.activity.temm:id/commercialPlanPrepaidSpin",
    mlRolloverOption: 'android=new UiSelector().text("ML - Prepago Rollover Portabilidad")',

    // Spinner de ML Prepago Rollover Portabilidad (aparece después de ingresar NIP)
    mlRolloverSpinner: "id=es.indra.pc.mobile.activity.temm:id/textview_spinner",

    // Spinner de FVC (fecha)
    fvcSpinner: "id=es.indra.pc.mobile.activity.temm:id/fvcSuggestedSpin",

    // Botón SIGUIENTE - múltiples estrategias
    btnSiguienteByText: 'android=new UiSelector().text("SIGUIENTE")',
    // XPath más específico: botón SIGUIENTE dentro de un TableRow
    btnSiguienteInTableRow: '//android.widget.TableRow//android.widget.Button[@text="SIGUIENTE"]',
    // XPath general como fallback
    btnSiguienteXPath: '//android.widget.Button[@text="SIGUIENTE"]',

    // Opciones de fecha en el spinner (ListView con TextViews)
    // Las fechas se seleccionan por texto: android=new UiSelector().text("27/02/2026")

    // Sección 2: Datos Personales
    nombreText: "id=es.indra.pc.mobile.activity.temm:id/nameText",
    nombreSecondText: "id=es.indra.pc.mobile.activity.temm:id/nameSecondText",
    surnameText: "id=es.indra.pc.mobile.activity.temm:id/surnameText",
    surnameSecondText: "id=es.indra.pc.mobile.activity.temm:id/surnameSecondText",
    curpText: "id=es.indra.pc.mobile.activity.temm:id/curpText",
    phoneText: "id=es.indra.pc.mobile.activity.temm:id/phoneText",
    phoneSecondText: "id=es.indra.pc.mobile.activity.temm:id/phoneSecondText",
    generoSpinner: "id=es.indra.pc.mobile.activity.temm:id/textview_spinner", // Reutilizamos el mismo selector
    personalEmailText: "id=es.indra.pc.mobile.activity.temm:id/personalEmailText",
    birthDateText: "id=es.indra.pc.mobile.activity.temm:id/birthDateText",

    // Opciones de género
    generoMasculino: 'android=new UiSelector().text("Masculino")',
    generoFemenino: 'android=new UiSelector().text("Femenino")',

    // Botones de navegación (se aplican a todas las secciones)
    btnSiguiente2: 'android=new UiSelector().text("SIGUIENTE")',
    btnAnterior: 'android=new UiSelector().text("ANTERIOR")',
    btnEnviar: 'android=new UiSelector().text("ENVIAR")',

    // Diálogo de éxito con FolioID
    // Mensaje de confirmación: "Tramite enviado correctamente a ONIX.\nFolioID: XXX"
    dialogSuccessMessage: "id=es.indra.pc.mobile.activity.temm:id/dialog_message",
    // Texto característico del diálogo de éxito
    dialogSuccessText: 'android=new UiSelector().textContains("Tramite enviado correctamente a ONIX")',
    dialogSuccessFolio: 'android=new UiSelector().textContains("FolioID:")',
    // Botón Aceptar del diálogo de éxito
    dialogSuccessBtnAceptar: "id=android:id/button1",

    // Diálogos de error del APK
    // Mensaje de error genérico (puede contener diversos mensajes de error)
    dialogErrorMessage: "id=es.indra.pc.mobile.activity.temm:id/dialog_message",
    // Textos característicos de diálogos de error comunes
    dialogErrorText: 'android=new UiSelector().textContains("Error")',
    dialogErrorValidation: 'android=new UiSelector().textContains("Lista de errores:")',
    // Errores específicos de CURP
    dialogErrorCurp7: 'android=new UiSelector().textContains("CURP del cliente cuenta con")',
    // Botón Aceptar del diálogo de error
    dialogErrorBtnAceptar: "id=android:id/button1",
} as const;
