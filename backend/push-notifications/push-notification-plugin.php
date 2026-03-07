<?php
/**
 * Plugin Name: MakeupOcean Push Notifications
 * Description: WordPress admin panel to send push notifications via the BFF server's Expo Push API
 * Version: 1.0.0
 * Author: MakeupOcean
 */

if (!defined('ABSPATH')) exit;

// ============================================================
// CONFIG: Point to your BFF server
// ============================================================
// Set these in wp-config.php:
//   define('MUO_BFF_URL', 'https://app.makeupocean.com/api/v1');
//   define('MUO_BFF_API_KEY', 'your-api-key-here');

function muo_push_get_bff_url() {
    return defined('MUO_BFF_URL') ? MUO_BFF_URL : 'https://app.makeupocean.com/api/v1';
}

function muo_push_get_api_key() {
    return defined('MUO_BFF_API_KEY') ? MUO_BFF_API_KEY : '';
}

// ============================================================
// 1. DATABASE: Notification history table
// ============================================================

register_activation_hook(__FILE__, 'muo_push_create_table');

function muo_push_create_table() {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    $history_table = $wpdb->prefix . 'muo_push_history';
    $sql = "CREATE TABLE IF NOT EXISTS $history_table (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) DEFAULT '',
        body TEXT DEFAULT '',
        screen VARCHAR(100) DEFAULT '',
        params TEXT DEFAULT '',
        image_url VARCHAR(500) DEFAULT '',
        sent_count INT UNSIGNED DEFAULT 0,
        failed_count INT UNSIGNED DEFAULT 0,
        total_targeted INT UNSIGNED DEFAULT 0,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
}

// ============================================================
// 2. ADMIN MENU
// ============================================================

add_action('admin_menu', function () {
    add_menu_page(
        'Push Notifications',
        'Push Notifications',
        'manage_options',
        'muo-push-notifications',
        'muo_push_admin_page',
        'dashicons-bell',
        30
    );
});

// ============================================================
// 3. ADMIN PAGE: Compose & send notifications
// ============================================================

function muo_push_admin_page() {
    global $wpdb;
    $history_table = $wpdb->prefix . 'muo_push_history';
    $bff_url = muo_push_get_bff_url();
    $api_key = muo_push_get_api_key();

    // Fetch live device stats from BFF
    $device_stats = muo_push_fetch_stats();

    // Handle form submission
    $result_message = '';
    if (isset($_POST['muo_push_send']) && wp_verify_nonce($_POST['muo_push_nonce'], 'muo_push_send_action')) {
        $title     = sanitize_text_field($_POST['push_title']);
        $subtitle  = sanitize_text_field($_POST['push_subtitle']);
        $body_text = sanitize_textarea_field($_POST['push_body']);
        $screen    = sanitize_text_field($_POST['push_screen']);
        $params    = sanitize_text_field($_POST['push_params']);
        $image_url = esc_url_raw($_POST['push_image']);

        if (empty($title)) {
            $result_message = '<div class="notice notice-error"><p>Title is required.</p></div>';
        } else {
            // Use body field, fallback to subtitle
            $notification_body = !empty($body_text) ? $body_text : $subtitle;

            // Build data payload for in-app navigation
            $data = [];
            if (!empty($screen)) {
                $data['screen'] = $screen;
                if (!empty($params)) {
                    $decoded = json_decode(stripslashes($params), true);
                    if (is_array($decoded)) {
                        $data['params'] = $decoded;
                    }
                }
            }

            // Call BFF /notifications/send endpoint
            $send_result = muo_push_send_via_bff($title, $notification_body, $data, $image_url);

            if (isset($send_result['error'])) {
                $result_message = sprintf(
                    '<div class="notice notice-error"><p>Failed: %s</p></div>',
                    esc_html($send_result['error'])
                );
            } else {
                $result_message = sprintf(
                    '<div class="notice notice-success"><p>Notification sent! Delivered: %d, Failed: %d, Total targeted: %d</p></div>',
                    $send_result['sent'],
                    $send_result['failed'],
                    $send_result['total_targeted']
                );

                // Save to history
                $wpdb->insert($history_table, [
                    'title'          => $title,
                    'subtitle'       => $subtitle,
                    'body'           => $body_text,
                    'screen'         => $screen,
                    'params'         => $params,
                    'image_url'      => $image_url,
                    'sent_count'     => $send_result['sent'],
                    'failed_count'   => $send_result['failed'],
                    'total_targeted' => $send_result['total_targeted'],
                ]);
            }
        }
    }

    // Get recent history
    $history = $wpdb->get_results("SELECT * FROM $history_table ORDER BY sent_at DESC LIMIT 20");

    ?>
    <div class="wrap">
        <h1 style="display:flex;align-items:center;gap:8px;">
            <span class="dashicons dashicons-bell" style="font-size:28px;color:#661F1D;"></span>
            MakeupOcean Push Notifications
        </h1>

        <?php echo $result_message; ?>

        <?php if (empty($api_key)): ?>
        <div class="notice notice-warning">
            <p><strong>Setup required:</strong> Add these constants to your <code>wp-config.php</code>:</p>
            <pre style="background:#f5f5f5;padding:10px;border-radius:4px;">define('MUO_BFF_URL', 'https://app.makeupocean.com/api/v1');
define('MUO_BFF_API_KEY', 'your-api-key-here');</pre>
        </div>
        <?php endif; ?>

        <!-- Device Stats -->
        <div class="muo-stats" style="display:flex;gap:20px;margin:20px 0;flex-wrap:wrap;">
            <div style="background:#fff;padding:20px 30px;border-radius:8px;border:1px solid #ddd;text-align:center;min-width:140px;">
                <div style="font-size:36px;font-weight:bold;color:#661F1D;">
                    <?php echo $device_stats ? $device_stats['active'] : '--'; ?>
                </div>
                <div style="color:#666;margin-top:4px;">Active Devices</div>
            </div>
            <div style="background:#fff;padding:20px 30px;border-radius:8px;border:1px solid #ddd;text-align:center;min-width:140px;">
                <div style="font-size:36px;font-weight:bold;color:#3ddc84;">
                    <?php echo $device_stats ? $device_stats['android'] : '--'; ?>
                </div>
                <div style="color:#666;margin-top:4px;">Android</div>
            </div>
            <div style="background:#fff;padding:20px 30px;border-radius:8px;border:1px solid #ddd;text-align:center;min-width:140px;">
                <div style="font-size:36px;font-weight:bold;color:#007AFF;">
                    <?php echo $device_stats ? $device_stats['ios'] : '--'; ?>
                </div>
                <div style="color:#666;margin-top:4px;">iOS</div>
            </div>
            <?php if ($device_stats === null): ?>
            <div style="align-self:center;color:#999;font-style:italic;">
                Could not connect to BFF server. Check your MUO_BFF_URL config.
            </div>
            <?php endif; ?>
        </div>

        <!-- Send Notification Form -->
        <div style="background:#fff;padding:24px;border-radius:8px;border:1px solid #ddd;max-width:650px;">
            <h2 style="margin-top:0;">Send Push Notification</h2>
            <form method="post">
                <?php wp_nonce_field('muo_push_send_action', 'muo_push_nonce'); ?>

                <table class="form-table">
                    <tr>
                        <th><label for="push_title">Title <span style="color:red;">*</span></label></th>
                        <td>
                            <input type="text" id="push_title" name="push_title" class="regular-text" required
                                   placeholder="Flash Sale Today!"
                                   value="<?php echo isset($_POST['push_title']) ? esc_attr($_POST['push_title']) : ''; ?>">
                        </td>
                    </tr>
                    <tr>
                        <th><label for="push_subtitle">Subtitle</label></th>
                        <td>
                            <input type="text" id="push_subtitle" name="push_subtitle" class="regular-text"
                                   placeholder="Up to 50% off on all lipsticks"
                                   value="<?php echo isset($_POST['push_subtitle']) ? esc_attr($_POST['push_subtitle']) : ''; ?>">
                            <p class="description">Shown below title on iOS. Used as body fallback if body is empty.</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="push_body">Body</label></th>
                        <td>
                            <textarea id="push_body" name="push_body" class="large-text" rows="3"
                                      placeholder="Don't miss our biggest sale of the year..."><?php echo isset($_POST['push_body']) ? esc_textarea($_POST['push_body']) : ''; ?></textarea>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="push_image">Image URL</label></th>
                        <td>
                            <input type="url" id="push_image" name="push_image" class="regular-text"
                                   placeholder="https://example.com/banner.jpg"
                                   value="<?php echo isset($_POST['push_image']) ? esc_attr($_POST['push_image']) : ''; ?>">
                            <p class="description">Optional banner image (Android rich notification)</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="push_screen">Navigate To</label></th>
                        <td>
                            <select id="push_screen" name="push_screen" style="min-width:300px;">
                                <option value="">-- None (just open app) --</option>
                                <option value="Home" <?php selected(isset($_POST['push_screen']) ? $_POST['push_screen'] : '', 'Home'); ?>>Home</option>
                                <option value="Category" <?php selected(isset($_POST['push_screen']) ? $_POST['push_screen'] : '', 'Category'); ?>>Category (needs categoryId + name)</option>
                                <option value="ProductDetail" <?php selected(isset($_POST['push_screen']) ? $_POST['push_screen'] : '', 'ProductDetail'); ?>>Product Detail (needs productId)</option>
                                <option value="ProductList" <?php selected(isset($_POST['push_screen']) ? $_POST['push_screen'] : '', 'ProductList'); ?>>Product List (needs categoryId)</option>
                                <option value="OrderTracking" <?php selected(isset($_POST['push_screen']) ? $_POST['push_screen'] : '', 'OrderTracking'); ?>>Order Tracking (needs orderId)</option>
                                <option value="OrderHistory" <?php selected(isset($_POST['push_screen']) ? $_POST['push_screen'] : '', 'OrderHistory'); ?>>Order History</option>
                            </select>
                            <p class="description">Screen to open when user taps the notification</p>
                        </td>
                    </tr>
                    <tr id="params_row">
                        <th><label for="push_params">Screen Params</label></th>
                        <td>
                            <input type="text" id="push_params" name="push_params" class="regular-text"
                                   placeholder='{"categoryId": 123, "name": "Lipsticks"}'
                                   value="<?php echo isset($_POST['push_params']) ? esc_attr($_POST['push_params']) : ''; ?>">
                            <p class="description">JSON object with params for the selected screen</p>
                            <div id="params_hint" style="margin-top:6px;padding:8px 12px;background:#f0f0f1;border-radius:4px;display:none;font-size:12px;"></div>
                        </td>
                    </tr>
                </table>

                <p class="submit" style="display:flex;gap:12px;align-items:center;">
                    <input type="submit" name="muo_push_send" class="button button-primary button-hero"
                           value="Send to All Devices"
                           style="background:#661F1D;border-color:#4a1614;"
                           onclick="return confirm('Send this notification to all <?php echo $device_stats ? $device_stats['active'] : ''; ?> registered devices?');">
                    <span style="color:#666;">This will push to all registered devices immediately.</span>
                </p>
            </form>
        </div>

        <!-- Notification History -->
        <?php if (!empty($history)): ?>
        <div style="background:#fff;padding:24px;border-radius:8px;border:1px solid #ddd;margin-top:24px;">
            <h2 style="margin-top:0;">Recent Notifications</h2>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Body</th>
                        <th>Screen</th>
                        <th>Delivered</th>
                        <th>Failed</th>
                        <th>Targeted</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($history as $item): ?>
                    <tr>
                        <td><strong><?php echo esc_html($item->title); ?></strong>
                            <?php if (!empty($item->subtitle)): ?>
                            <br><small style="color:#666;"><?php echo esc_html($item->subtitle); ?></small>
                            <?php endif; ?>
                        </td>
                        <td><?php echo esc_html(mb_strimwidth($item->body, 0, 60, '...')); ?></td>
                        <td>
                            <?php if (!empty($item->screen)): ?>
                                <code><?php echo esc_html($item->screen); ?></code>
                                <?php if (!empty($item->params)): ?>
                                <br><small style="color:#999;"><?php echo esc_html(mb_strimwidth($item->params, 0, 40, '...')); ?></small>
                                <?php endif; ?>
                            <?php else: ?>
                                <span style="color:#ccc;">-</span>
                            <?php endif; ?>
                        </td>
                        <td style="color:green;font-weight:bold;"><?php echo $item->sent_count; ?></td>
                        <td style="color:<?php echo $item->failed_count > 0 ? 'red' : '#ccc'; ?>;">
                            <?php echo $item->failed_count; ?>
                        </td>
                        <td><?php echo $item->total_targeted; ?></td>
                        <td style="white-space:nowrap;"><?php echo date('M j, Y g:ia', strtotime($item->sent_at)); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>

    <script>
    (function() {
        var screenSelect = document.getElementById('push_screen');
        var paramsHint = document.getElementById('params_hint');
        var paramsInput = document.getElementById('push_params');

        var hints = {
            'Category':     'Example: {"categoryId": 9099, "name": "Lips"}',
            'ProductDetail': 'Example: {"productId": 12345}',
            'ProductList':   'Example: {"categoryId": 9099, "name": "Lipsticks"}',
            'OrderTracking': 'Example: {"orderId": 6789}',
        };

        function updateHint() {
            var val = screenSelect.value;
            if (hints[val]) {
                paramsHint.textContent = hints[val];
                paramsHint.style.display = 'block';
            } else {
                paramsHint.style.display = 'none';
            }
        }

        screenSelect.addEventListener('change', updateHint);
        updateHint();
    })();
    </script>
    <?php
}

// ============================================================
// 4. BFF COMMUNICATION: Send notification via BFF /notifications/send
// ============================================================

function muo_push_send_via_bff($title, $body, $data = [], $image = '') {
    $bff_url = muo_push_get_bff_url();
    $api_key = muo_push_get_api_key();

    $payload = [
        'title' => $title,
        'body'  => $body,
    ];

    if (!empty($data)) {
        $payload['data'] = $data;
    }

    if (!empty($image)) {
        $payload['image'] = $image;
    }

    // No specific tokens = send to ALL devices (BFF handles this)
    $response = wp_remote_post($bff_url . '/notifications/send', [
        'headers' => [
            'Content-Type' => 'application/json',
            'X-API-Key'    => $api_key,
        ],
        'body'    => wp_json_encode($payload),
        'timeout' => 30,
    ]);

    if (is_wp_error($response)) {
        return ['error' => $response->get_error_message(), 'sent' => 0, 'failed' => 0, 'total_targeted' => 0];
    }

    $status_code = wp_remote_retrieve_response_code($response);
    $body_response = json_decode(wp_remote_retrieve_body($response), true);

    if ($status_code !== 200 || empty($body_response['success'])) {
        $error_msg = isset($body_response['message']) ? $body_response['message'] : "HTTP $status_code";
        return ['error' => $error_msg, 'sent' => 0, 'failed' => 0, 'total_targeted' => 0];
    }

    return [
        'sent'           => isset($body_response['sent']) ? (int)$body_response['sent'] : 0,
        'failed'         => isset($body_response['failed']) ? (int)$body_response['failed'] : 0,
        'total_targeted' => isset($body_response['total_targeted']) ? (int)$body_response['total_targeted'] : 0,
    ];
}

// ============================================================
// 5. STATS: Fetch device stats from BFF /notifications/stats
// ============================================================

function muo_push_fetch_stats() {
    $bff_url = muo_push_get_bff_url();
    $api_key = muo_push_get_api_key();

    $response = wp_remote_get($bff_url . '/notifications/stats', [
        'headers' => [
            'X-API-Key' => $api_key,
        ],
        'timeout' => 10,
    ]);

    if (is_wp_error($response)) {
        return null;
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);

    if (empty($body['success'])) {
        return null;
    }

    // Count platforms from the all_tokens data
    $android = 0;
    $ios = 0;
    $active = isset($body['active_tokens']) ? (int)$body['active_tokens'] : 0;

    if (isset($body['all_tokens']) && is_array($body['all_tokens'])) {
        foreach ($body['all_tokens'] as $token => $info) {
            if (empty($info['active'])) continue;
            if (isset($info['platform']) && $info['platform'] === 'ios') {
                $ios++;
            } else {
                $android++;
            }
        }
    }

    return [
        'active'  => $active,
        'android' => $android,
        'ios'     => $ios,
    ];
}

// ============================================================
// 6. WooCommerce ORDER HOOKS: Auto-notify on order status change
// ============================================================

add_action('woocommerce_order_status_changed', 'muo_push_order_status_notification', 10, 4);

function muo_push_order_status_notification($order_id, $old_status, $new_status, $order) {
    $user_id = $order->get_user_id();
    if (!$user_id) return;

    $status_messages = [
        'processing' => ['title' => 'Order Confirmed!',  'body' => 'Your order #%s is being processed.'],
        'shipped'    => ['title' => 'Order Shipped!',     'body' => 'Your order #%s is on its way!'],
        'completed'  => ['title' => 'Order Delivered!',   'body' => 'Your order #%s has been delivered.'],
        'cancelled'  => ['title' => 'Order Cancelled',    'body' => 'Your order #%s has been cancelled.'],
        'refunded'   => ['title' => 'Order Refunded',     'body' => 'Your order #%s has been refunded.'],
        'on-hold'    => ['title' => 'Order On Hold',      'body' => 'Your order #%s is on hold. We\'ll update you soon.'],
    ];

    if (!isset($status_messages[$new_status])) return;

    $msg = $status_messages[$new_status];
    $order_number = $order->get_order_number();

    $bff_url = muo_push_get_bff_url();
    $api_key = muo_push_get_api_key();

    // Send to specific user via BFF
    wp_remote_post($bff_url . '/notifications/send', [
        'headers' => [
            'Content-Type' => 'application/json',
            'X-API-Key'    => $api_key,
        ],
        'body' => wp_json_encode([
            'title'  => $msg['title'],
            'body'   => sprintf($msg['body'], $order_number),
            'userId' => $user_id,
            'data'   => [
                'type'    => 'ORDER_UPDATE',
                'orderId' => $order_id,
                'status'  => $new_status,
                'screen'  => 'OrderTracking',
                'params'  => ['orderId' => $order_id],
            ],
        ]),
        'timeout'  => 15,
        'blocking' => false, // Fire-and-forget so it doesn't slow down WooCommerce
    ]);
}
