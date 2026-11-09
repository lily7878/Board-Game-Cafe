package ro.boardgamecafe.core.domain.billing;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;
import ro.boardgamecafe.core.domain.menu.MenuCategory;
import ro.boardgamecafe.core.domain.menu.MenuItem;
import ro.boardgamecafe.core.domain.order.FoodOrder;
import ro.boardgamecafe.core.domain.order.OrderStatus;
import ro.boardgamecafe.core.domain.staff.StaffRole;
import ro.boardgamecafe.core.domain.staff.StaffUser;
import ro.boardgamecafe.core.domain.table.SessionParticipant;

class BillCalculatorTest {
    private static final BigDecimal FEE = new BigDecimal("10.00");
    private final StaffUser staff = new StaffUser("Staff", "s@test.ro", "hash", StaffRole.STAFF);
    private MenuItem coffee;
    private MenuItem cake;
    private SessionParticipant ana;
    private SessionParticipant bogdan;

    @BeforeEach
    void setUp() {
        MenuCategory category = new MenuCategory("Menu", null);
        coffee = new MenuItem(category, "Coffee", null, new BigDecimal("8.50"));
        cake = new MenuItem(category, "Cake", null, new BigDecimal("15.00"));
        ana = participant(1L, "Ana");
        bogdan = participant(2L, "Bogdan");
    }

    @Test
    void onlyAcceptedLinesOfDeliveredOrdersAreBilled_plusFees() {
        FoodOrder delivered = order(ana, 2, 1);           // coffee x2 accepted, cake x1 rejected
        accept(delivered, true, false);
        deliver(delivered);
        FoodOrder cancelled = order(bogdan, 1, 1);
        accept(cancelled, false, false);                  // all rejected -> CANCELLED

        Bill bill = BillCalculator.calculate(FEE, 3, List.of(ana, bogdan), List.of(delivered, cancelled), 0);

        assertThat(bill.menuTotal()).isEqualByComparingTo("17.00");
        assertThat(bill.feesTotal()).isEqualByComparingTo("30.00");
        assertThat(bill.total()).isEqualByComparingTo("47.00");
        assertThat(bill.participants()).extracting(Bill.ParticipantShare::displayName).containsExactly("Ana", "Bogdan");
        assertThat(bill.participants().get(0).lines()).hasSize(1);
        assertThat(bill.participants().get(1).menuTotal()).isEqualByComparingTo("0");
        assertThat(bill.obstacles().none()).isTrue();
    }

    @Test
    void openOrdersAndUnresolvedGames_blockPayment_andAreNotBilled() {
        FoodOrder placed = order(ana, 1, 0);
        FoodOrder preparing = order(bogdan, 0, 2);
        accept(preparing, true);
        preparing.advanceTo(OrderStatus.PREPARING, staff);

        Bill bill = BillCalculator.calculate(FEE, 2, List.of(ana, bogdan), List.of(placed, preparing), 1);

        assertThat(bill.menuTotal()).isEqualByComparingTo("0");
        assertThat(bill.pendingOrdersValue()).isEqualByComparingTo("38.50");
        assertThat(bill.obstacles().openOrders()).isEqualTo(2);
        assertThat(bill.obstacles().unresolvedGameRequests()).isEqualTo(1);
        assertThat(bill.obstacles().none()).isFalse();
    }

    @Test
    void missingPersons_isAnObstacle_andAddsNoFees() {
        Bill bill = BillCalculator.calculate(FEE, null, List.of(ana), List.of(), 0);

        assertThat(bill.feesTotal()).isEqualByComparingTo("0");
        assertThat(bill.obstacles().personsMissing()).isTrue();
        assertThat(bill.obstacles().none()).isFalse();
    }

    private FoodOrder order(SessionParticipant participant, int coffees, int cakes) {
        List<FoodOrder.Line> lines = new java.util.ArrayList<>();
        if (coffees > 0) lines.add(new FoodOrder.Line(coffee, coffees));
        if (cakes > 0) lines.add(new FoodOrder.Line(cake, cakes));
        FoodOrder order = new FoodOrder(participant, lines);
        long id = 100;
        for (var item : order.getItems()) ReflectionTestUtils.setField(item, "id", id++);
        return order;
    }

    private void accept(FoodOrder order, boolean... accepted) {
        List<FoodOrder.ItemDecision> decisions = new java.util.ArrayList<>();
        for (int i = 0; i < accepted.length; i++)
            decisions.add(new FoodOrder.ItemDecision(order.getItems().get(i).getId(), accepted[i], null));
        order.process(decisions, staff);
    }

    private void deliver(FoodOrder order) {
        order.advanceTo(OrderStatus.PREPARING, staff);
        order.advanceTo(OrderStatus.READY, staff);
        order.advanceTo(OrderStatus.DELIVERED, staff);
    }

    private static SessionParticipant participant(Long id, String name) {
        SessionParticipant participant = Mockito.mock(SessionParticipant.class);
        Mockito.when(participant.getId()).thenReturn(id);
        Mockito.when(participant.getDisplayName()).thenReturn(name);
        Mockito.when(participant.isActive()).thenReturn(true);
        return participant;
    }
}
