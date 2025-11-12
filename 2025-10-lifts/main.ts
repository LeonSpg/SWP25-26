export class Lift {
    private currentFloor: number;
    private direction: "up" | "down" | "idle";
    private calls: Set<number>;
    private passengers: Map<number, number>;

    constructor(initialFloor: number = 0) {
        this.currentFloor = initialFloor;
        this.direction = "idle";
        this.calls = new Set();
        this.passengers = new Map();
    }

    getCurrentFloor(): number {
        return this.currentFloor;
    }

    getDirection(): "up" | "down" | "idle" {
        return this.direction;
    }

    call(floor: number): void {
        if (floor !== this.currentFloor) {
            this.calls.add(floor);
        }
    }

    request(floor: number): void {
        if (floor !== this.currentFloor) {
            this.calls.add(floor);
        }
    }

    board(destination: number): void {
        if (destination !== this.currentFloor) {
            this.passengers.set(this.currentFloor, destination);
            this.calls.add(destination);
        }
    }

    move(): void {
        if (this.direction === "idle") {
            this.determineDirection();
        }

        if (this.direction === "up") {
            this.currentFloor++;
        } else if (this.direction === "down") {
            this.currentFloor--;
        }

        this.checkStop();
    }

    private determineDirection(): void {
        if (this.calls.size === 0 && this.passengers.size === 0) {
            this.direction = "idle";
            return;
        }

        const hasCallsAbove = Array.from(this.calls).some(f => f > this.currentFloor);
        const hasPassengersAbove = Array.from(this.passengers.values()).some(d => d > this.currentFloor);

        const hasCallsBelow = Array.from(this.calls).some(f => f < this.currentFloor);
        const hasPassengersBelow = Array.from(this.passengers.values()).some(d => d < this.currentFloor);

        if (this.direction === "up" && (hasCallsAbove || hasPassengersAbove)) {
            return;
        }

        if (this.direction === "down" && (hasCallsBelow || hasPassengersBelow)) {
            return;
        }

        if (hasCallsAbove || hasPassengersAbove) {
            this.direction = "up";
        } else if (hasCallsBelow || hasPassengersBelow) {
            this.direction = "down";
        } else {
            this.direction = "idle";
        }
    }

    private checkStop(): void {
        let shouldStop = false;

        if (this.calls.has(this.currentFloor)) {
            this.calls.delete(this.currentFloor);
            shouldStop = true;
        }

        const passengersGettingOff = Array.from(this.passengers.entries())
            .filter(([_, dest]) => dest === this.currentFloor)
            .map(([floor, _]) => floor);

        passengersGettingOff.forEach(floor => {
            this.passengers.delete(floor);
            shouldStop = true;
        });

        if (shouldStop) {
            this.determineDirection();
        }
    }

    getPendingCalls(): number[] {
        return Array.from(this.calls).sort((a, b) => a - b);
    }

    getPassengers(): Map<number, number> {
        return new Map(this.passengers);
    }
}

if (import.meta.main) {
    const lift = new Lift(0);

    console.log("Initial state:");
    console.log(`Floor: ${lift.getCurrentFloor()}, Direction: ${lift.getDirection()}`);

    lift.call(3);
    console.log("\nCalled from floor 3");
    console.log(`Pending calls: ${lift.getPendingCalls()}`);

    while (lift.getCurrentFloor() < 3) {
        lift.move();
        console.log(`Moved to floor ${lift.getCurrentFloor()}, Direction: ${lift.getDirection()}`);
    }

    lift.board(5);
    console.log("\nPassenger boarded, going to floor 5");
    console.log(`Pending calls: ${lift.getPendingCalls()}`);

    while (lift.getCurrentFloor() < 5) {
        lift.move();
        console.log(`Moved to floor ${lift.getCurrentFloor()}, Direction: ${lift.getDirection()}`);
    }

    console.log("\nFinal state:");
    console.log(`Floor: ${lift.getCurrentFloor()}, Direction: ${lift.getDirection()}`);
    console.log(`Pending calls: ${lift.getPendingCalls()}`);
}
