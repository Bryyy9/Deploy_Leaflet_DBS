export class Alert {
  static success(message, title = 'Success!') {
    if (window.Swal) {
      return window.Swal.fire({
        icon: 'success',
        title,
        text: message,
        confirmButtonColor: '#00d4ff'
      });
    } else {
      alert(`${title}\n${message}`);
      return Promise.resolve({ isConfirmed: true });
    }
  }

  static error(message, title = 'Error!') {
    if (window.Swal) {
      return window.Swal.fire({
        icon: 'error',
        title,
        text: message,
        confirmButtonColor: '#00d4ff'
      });
    } else {
      alert(`${title}\n${message}`);
      return Promise.resolve({ isConfirmed: true });
    }
  }

  static confirm(message, title = 'Are you sure?') {
    if (window.Swal) {
      return window.Swal.fire({
        icon: 'question',
        title,
        text: message,
        showCancelButton: true,
        confirmButtonColor: '#00d4ff',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      });
    } else {
      const result = confirm(`${title}\n${message}`);
      return Promise.resolve({ isConfirmed: result });
    }
  }

  static loading(message = 'Loading...') {
    if (window.Swal) {
      return window.Swal.fire({
        title: message,
        allowOutsideClick: false,
        didOpen: () => {
          window.Swal.showLoading();
        }
      });
    }
    return Promise.resolve();
  }

  static toast(message, type = 'success') {
    if (window.Swal) {
      return window.Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } else {
      console.log(`Toast: ${message}`);
    }
    return Promise.resolve();
  }
}

export default Alert;