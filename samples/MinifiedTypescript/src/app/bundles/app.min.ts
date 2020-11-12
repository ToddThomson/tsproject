class a {
  private b: HTMLElement;
  private c: HTMLElement;
  private d: number;

  constructor(d: HTMLElement) {
    this.b = d;
    this.b.innerHTML += "The time is: ";
    this.c = document.createElement("span");
    this.b.appendChild(this.c);
    this.c.innerText = new Date().toUTCString();
  }

  e() {
    this.d = window.setInterval(
      () => (this.c.innerHTML = new Date().toUTCString()),
      500
    );
  }

  f() {
    clearTimeout(this.d);
  }
}

export namespace MyApp {
  var f = document.getElementById("content");
  export var greeter = new a(f);
}

MyApp.greeter.e();
