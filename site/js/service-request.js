(function () {
  'use strict';

  // Solar servicing, panel cleaning and bird-proofing each link here with a
  // ?type= query param so the "what do you need help with?" dropdown is
  // preselected to match what the visitor actually clicked through for,
  // instead of making them re-state it.
  var typeMap = {
    servicing: 'Solar servicing',
    cleaning: 'Panel cleaning',
    'bird-proofing': 'Bird-proofing',
  };

  var select = document.getElementById('srType');
  if (!select) return;

  var params = new URLSearchParams(window.location.search);
  var key = params.get('type');
  var label = key && typeMap[key];
  if (label) select.value = label;
})();
