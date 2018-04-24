(function() {
  window.Agreement = {

    showProtocol: function() {
      Dialog.show({
        title: T("page:agreement.title"),
        template: '/js/libs/mst/protocol.mst',
        userClass: 'protocol-dialog',
        autoClose: false,
        actions: [Dialog.CLOSE_ACTION]
      });
    },

    showLaw: function() {
      Dialog.show({
        title: '法律声明',
        template: '/js/libs/mst/law.mst',
        userClass: 'law-dialog',
        autoClose: false,
        actions: [Dialog.CLOSE_ACTION]
      });
    },

    showParents: function() {
      Dialog.show({
        title: '家长监护',
        template: '/js/libs/mst/parents.mst',
        userClass: 'parents-dialog',
        autoClose: false,
        actions: [Dialog.CLOSE_ACTION]
      });
    },

    showDispute: function() {
      Dialog.show({
        title: '用户纠纷处理',
        template: '/js/libs/mst/dispute.mst',
        userClass: 'dispute-dialog',
        autoClose: false,
        actions: [Dialog.CLOSE_ACTION]
      });
    }

  };
})();
