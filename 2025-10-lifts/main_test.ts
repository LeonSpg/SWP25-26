import { assertEquals } from "@std/assert";
import { Lift } from "./main.ts";

Deno.test("Lift starts at initial floor", function () {
    const lift = new Lift(0);
    assertEquals(lift.getCurrentFloor(), 0);
    assertEquals(lift.getDirection(), "idle");
});

Deno.test("Lift can be called from a floor", function () {
    const lift = new Lift(0);
    lift.call(3);
    const calls = lift.getPendingCalls();
    assertEquals(calls.length, 1);
    assertEquals(calls[0], 3);
});

Deno.test("Lift moves towards called floor", function () {
    const lift = new Lift(0);
    lift.call(3);
    lift.move();
    assertEquals(lift.getCurrentFloor(), 1);
    assertEquals(lift.getDirection(), "up");
});

Deno.test("Lift stops at called floor", function () {
    const lift = new Lift(0);
    lift.call(2);
    
    lift.move(); // floor 1
    lift.move(); // floor 2
    
    assertEquals(lift.getCurrentFloor(), 2);
    assertEquals(lift.getPendingCalls().length, 0);
});

Deno.test("Lift can board passengers", function () {
    const lift = new Lift(2);
    lift.board(5);
    
    const passengers = lift.getPassengers();
    assertEquals(passengers.size, 1);
    assertEquals(passengers.get(2), 5);
    assertEquals(lift.getPendingCalls().includes(5), true);
});

Deno.test("Lift moves down when called from below", function () {
    const lift = new Lift(5);
    lift.call(2);
    lift.move();
    
    assertEquals(lift.getCurrentFloor(), 4);
    assertEquals(lift.getDirection(), "down");
});
