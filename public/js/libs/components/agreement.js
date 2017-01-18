(function() {
  window.Agreement = {

    showProtocol: function() {
      Dialog.show({
        title: '用户协议',
        template: '/js/libs/mst/protocol.mst',
        userClass: 'protocol-dialog',
        autoClose: false,
        actions: [Dialog.CLOSE_ACTION]
      });
    },

    showLaw: function() {
      Dialog.show({
        title: '法律声明',
        template: '/js/libs/mst/law.html',
        userClass: 'law-dialog',
        autoClose: false,
        actions: [Dialog.CLOSE_ACTION]
      });
    }

  };
})();
